import type { SupabaseClient } from "../../db/supabase.client";
import type { AIGeneration, AIInputPayload, AIGeneratedRecipe } from "../../types";

export async function createAIGeneration(
  userId: string,
  inputPayload: AIInputPayload,
  supabase: SupabaseClient
): Promise<string> {
  const { data, error } = await supabase
    .from("ai_generations")
    .insert({
      user_id: userId,
      input_payload: inputPayload as any,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to create AI generation:", error);
    throw error;
  }

  return data.id;
}

export async function updateAIGenerationSuccess(
  generationId: string,
  outputPayload: AIGeneratedRecipe,
  supabase: SupabaseClient
): Promise<AIGeneration> {
  const { data, error } = await supabase
    .from("ai_generations")
    .update({
      output_payload: outputPayload as any,
    })
    .eq("id", generationId)
    .select()
    .single();

  if (error) {
    console.error("Failed to update AI generation with success:", error);
    throw error;
  }

  return data;
}

export async function updateAIGenerationError(
  generationId: string,
  errorMessage: string,
  supabase: SupabaseClient
): Promise<void> {
  const { error } = await supabase
    .from("ai_generations")
    .update({
      error_message: errorMessage,
    })
    .eq("id", generationId);

  if (error) {
    console.error("Failed to update AI generation with error:", error);
    throw error;
  }
}

export async function getUserGenerations(
  userId: string,
  statusFilter: "success" | "error" | "all",
  supabase: SupabaseClient
): Promise<AIGeneration[]> {
  let query = supabase
    .from("ai_generations")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  // Apply status filter
  if (statusFilter === "success") {
    query = query.not("output_payload", "is", null);
  } else if (statusFilter === "error") {
    query = query.not("error_message", "is", null);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch user generations:", error);
    throw error;
  }

  return data || [];
}

export async function getGenerationById(generationId: string, supabase: SupabaseClient): Promise<AIGeneration | null> {
  const { data, error } = await supabase.from("ai_generations").select("*").eq("id", generationId).single();

  if (error) {
    // PGRST116 is "not found" error code in PostgREST
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("Failed to fetch generation by ID:", error);
    throw error;
  }

  return data;
}
