import type { SupabaseClient } from "../../db/supabase.client";
import type { UserOnboardingEntity, PreferencesInput, OnboardingCompleteResponse } from "../../types";
import { updateUserPreferences } from "./preferences.service";

export async function getOnboardingStatus(
  userId: string,
  supabase: SupabaseClient
): Promise<UserOnboardingEntity | null> {
  const { data, error } = await supabase.from("user_onboarding").select("*").eq("user_id", userId).single();

  if (error) {
    // PostgreSQL error code 'PGRST116' means no rows returned
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  return data;
}

export async function updateOnboardingProgress(
  userId: string,
  currentStep: number,
  supabase: SupabaseClient
): Promise<UserOnboardingEntity> {
  const { data, error } = await supabase
    .from("user_onboarding")
    .upsert(
      {
        user_id: userId,
        current_step: currentStep,
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function completeOnboarding(
  userId: string,
  preferences: PreferencesInput,
  supabase: SupabaseClient
): Promise<OnboardingCompleteResponse> {
  const currentOnboarding = await getOnboardingStatus(userId, supabase);

  if (!currentOnboarding) {
    throw new Error("Onboarding not started");
  }

  if (currentOnboarding.current_step !== 5) {
    throw new Error("Must be on step 5 to complete onboarding");
  }

  const { data: updatedOnboarding, error: onboardingError } = await supabase
    .from("user_onboarding")
    .update({
      current_step: 5,
      completed_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .select()
    .single();

  if (onboardingError) {
    throw onboardingError;
  }

  const createdPreferences = await updateUserPreferences(userId, preferences, supabase);

  return {
    user_id: updatedOnboarding.user_id,
    current_step: updatedOnboarding.current_step,
    completed_at: updatedOnboarding.completed_at!,
    created_at: updatedOnboarding.created_at,
    preferences: createdPreferences,
  };
}
