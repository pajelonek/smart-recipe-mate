import type { SupabaseClient } from "../../db/supabase.client";
import type { Recipe, RecipeCreateInput, RecipeUpdateInput, RecipePartialUpdateInput } from "../../types";

/**
 * Maps database row to Recipe type
 */
function mapToRecipe(row: any): Recipe {
  return {
    id: row.id,
    owner_id: row.owner_id,
    title: row.title,
    summary: row.summary,
    ingredients: row.ingredients,
    preparation: row.preparation,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Get all recipes for a user
 * Returns recipes, excluding soft-deleted recipes
 * @param userId - User ID to fetch recipes for
 * @param supabase - Supabase client
 * @returns Array of Recipe objects
 */
export async function getUserRecipes(userId: string, supabase: SupabaseClient): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .eq("owner_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map(mapToRecipe);
}

/**
 * Get a single recipe by ID
 * Checks ownership and excludes soft-deleted recipes
 * @param recipeId - Recipe ID to fetch
 * @param userId - User ID for ownership check
 * @param supabase - Supabase client
 * @returns Recipe object, or null if not found
 */
export async function getRecipeById(
  recipeId: string,
  userId: string,
  supabase: SupabaseClient
): Promise<Recipe | null> {
  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", recipeId)
    .eq("owner_id", userId)
    .is("deleted_at", null)
    .single();

  if (error) {
    // PostgreSQL error code 'PGRST116' means no rows returned
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  return mapToRecipe(data);
}

/**
 * Create a new recipe
 * @param userId - Owner of the recipe
 * @param recipeData - Recipe data from request
 * @param supabase - Supabase client
 * @returns Created Recipe object
 */
export async function createRecipe(
  userId: string,
  recipeData: RecipeCreateInput,
  supabase: SupabaseClient
): Promise<Recipe> {
  // Insert recipe
  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .insert({
      owner_id: userId,
      title: recipeData.title,
      summary: recipeData.summary || null,
      ingredients: recipeData.ingredients,
      preparation: recipeData.preparation,
    })
    .select()
    .single();

  if (recipeError) throw recipeError;

  return mapToRecipe(recipe);
}

/**
 * Update a recipe (full replacement)
 * Replaces all fields
 * @param recipeId - Recipe ID to update
 * @param userId - User ID for ownership check
 * @param recipeData - Complete recipe data
 * @param supabase - Supabase client
 * @returns Updated Recipe object, or null if not found
 */
export async function updateRecipe(
  recipeId: string,
  userId: string,
  recipeData: RecipeUpdateInput,
  supabase: SupabaseClient
): Promise<Recipe | null> {
  // Check ownership
  const existing = await getRecipeById(recipeId, userId, supabase);
  if (!existing) return null;

  // Update recipe
  const { data, error: updateError } = await supabase
    .from("recipes")
    .update({
      title: recipeData.title,
      summary: recipeData.summary || null,
      ingredients: recipeData.ingredients,
      preparation: recipeData.preparation,
      updated_at: new Date().toISOString(),
    })
    .eq("id", recipeId)
    .eq("owner_id", userId)
    .select()
    .single();

  if (updateError) throw updateError;

  return mapToRecipe(data);
}

/**
 * Patch a recipe (partial update)
 * Updates only provided fields, preserves others
 * @param recipeId - Recipe ID to update
 * @param userId - User ID for ownership check
 * @param recipeData - Partial recipe data
 * @param supabase - Supabase client
 * @returns Updated Recipe object, or null if not found
 */
export async function patchRecipe(
  recipeId: string,
  userId: string,
  recipeData: RecipePartialUpdateInput,
  supabase: SupabaseClient
): Promise<Recipe | null> {
  // Check ownership
  const existing = await getRecipeById(recipeId, userId, supabase);
  if (!existing) return null;

  // Build update object with only provided fields
  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (recipeData.title !== undefined) updateData.title = recipeData.title;
  if (recipeData.summary !== undefined) updateData.summary = recipeData.summary || null;
  if (recipeData.ingredients !== undefined) updateData.ingredients = recipeData.ingredients;
  if (recipeData.preparation !== undefined) updateData.preparation = recipeData.preparation;

  // Update recipe
  const { data, error: updateError } = await supabase
    .from("recipes")
    .update(updateData)
    .eq("id", recipeId)
    .eq("owner_id", userId)
    .select()
    .single();

  if (updateError) throw updateError;

  return mapToRecipe(data);
}

/**
 * Soft delete a recipe
 * Sets deleted_at timestamp instead of removing the row
 * @param recipeId - Recipe ID to delete
 * @param userId - User ID for ownership check
 * @param supabase - Supabase client
 * @returns true if deleted, false if not found
 */
export async function deleteRecipe(recipeId: string, userId: string, supabase: SupabaseClient): Promise<boolean> {
  // Check ownership
  const existing = await getRecipeById(recipeId, userId, supabase);
  if (!existing) return false;

  // Soft delete
  const { error } = await supabase
    .from("recipes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", recipeId)
    .eq("owner_id", userId);

  if (error) throw error;

  return true;
}
