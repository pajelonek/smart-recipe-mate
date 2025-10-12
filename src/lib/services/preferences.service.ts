import type { SupabaseClient } from "../../db/supabase.client";
import type { TablesUpdate } from "../../db/database.types";
import type { UserPreferences, PreferencesUpdateInput, PreferencesPartialUpdateInput } from "../../types";

export async function getUserPreferences(userId: string, supabase: SupabaseClient): Promise<UserPreferences | null> {
  const { data, error } = await supabase.from("user_preferences").select("*").eq("user_id", userId).single();

  if (error) {
    // PostgreSQL error code 'PGRST116' means no rows returned
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  return data;
}

export async function updateUserPreferences(
  userId: string,
  preferencesData: PreferencesUpdateInput,
  supabase: SupabaseClient
): Promise<UserPreferences> {
  const { data, error } = await supabase
    .from("user_preferences")
    .upsert(
      {
        user_id: userId,
        diet_type: preferencesData.diet_type,
        preferred_ingredients: preferencesData.preferred_ingredients || "",
        preferred_cuisines: preferencesData.preferred_cuisines || "",
        allergens: preferencesData.allergens || "",
        notes: preferencesData.notes || null,
        updated_at: new Date().toISOString(),
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

export async function patchUserPreferences(
  userId: string,
  preferencesData: PreferencesPartialUpdateInput,
  supabase: SupabaseClient
): Promise<UserPreferences | null> {
  // First check if preferences exist
  const existing = await getUserPreferences(userId, supabase);
  if (!existing) {
    return null;
  }

  const updateData: TablesUpdate<"user_preferences"> = {
    updated_at: new Date().toISOString(),
  };

  if (preferencesData.diet_type !== undefined) updateData.diet_type = preferencesData.diet_type;
  if (preferencesData.preferred_ingredients !== undefined)
    updateData.preferred_ingredients = preferencesData.preferred_ingredients;
  if (preferencesData.preferred_cuisines !== undefined)
    updateData.preferred_cuisines = preferencesData.preferred_cuisines;
  if (preferencesData.allergens !== undefined) updateData.allergens = preferencesData.allergens;
  if (preferencesData.notes !== undefined) updateData.notes = preferencesData.notes;

  const { data, error } = await supabase
    .from("user_preferences")
    .update(updateData)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
