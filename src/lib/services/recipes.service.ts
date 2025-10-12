import type { SupabaseClient } from "../../db/supabase.client";
import type { Recipe, RecipeCreateInput, RecipeUpdateInput, RecipePartialUpdateInput, Tag } from "../../types";

/**
 * Maps database row with joined tags to Recipe type
 * Handles the nested recipe_tags structure from Supabase
 */
function mapToRecipe(row: any): Recipe {
  const tags: Tag[] =
    row.recipe_tags?.map((rt: any) => ({
      id: rt.tags.id,
      name: rt.tags.name,
      created_at: rt.tags.created_at,
    })) || [];

  return {
    id: row.id,
    owner_id: row.owner_id,
    title: row.title,
    summary: row.summary,
    ingredients: row.ingredients,
    preparation: row.preparation,
    created_at: row.created_at,
    updated_at: row.updated_at,
    tags,
  };
}

/**
 * Get or create tags for a user
 * Fetches existing tags and creates missing ones in a single batch
 * @param userId - Owner of the tags
 * @param tagNames - Array of tag names to get or create
 * @param supabase - Supabase client
 * @returns Array of Tag objects with IDs
 */
async function getOrCreateTags(userId: string, tagNames: string[], supabase: SupabaseClient): Promise<Tag[]> {
  if (tagNames.length === 0) return [];

  // 1. Fetch existing tags in one query
  const { data: existingTags } = await supabase
    .from("tags")
    .select("id, name, created_at")
    .eq("owner_id", userId)
    .in("name", tagNames);

  // 2. Determine which tags need to be created
  const existingNames = new Set(existingTags?.map((t) => t.name) || []);
  const newTagNames = tagNames.filter((name) => !existingNames.has(name));

  // 3. Create missing tags in single query
  if (newTagNames.length > 0) {
    const { data: newTags } = await supabase
      .from("tags")
      .insert(newTagNames.map((name) => ({ owner_id: userId, name })))
      .select("id, name, created_at");

    return [...(existingTags || []), ...(newTags || [])];
  }

  return existingTags || [];
}

/**
 * Associate tags with a recipe
 * Creates entries in the recipe_tags junction table
 * @param recipeId - Recipe to associate tags with
 * @param tags - Array of tags to associate
 * @param supabase - Supabase client
 */
async function associateTags(recipeId: string, tags: Tag[], supabase: SupabaseClient): Promise<void> {
  if (tags.length === 0) return;

  const associations = tags.map((tag) => ({
    recipe_id: recipeId,
    tag_id: tag.id,
  }));

  const { error } = await supabase.from("recipe_tags").insert(associations);

  if (error) throw error;
}

/**
 * Get all recipes for a user
 * Returns recipes with expanded tags, excluding soft-deleted recipes
 * @param userId - User ID to fetch recipes for
 * @param supabase - Supabase client
 * @returns Array of Recipe objects with tags
 */
export async function getUserRecipes(userId: string, supabase: SupabaseClient): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from("recipes")
    .select(
      `
      *,
      recipe_tags(
        tags(id, name, created_at)
      )
    `
    )
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
 * @returns Recipe object with tags, or null if not found
 */
export async function getRecipeById(
  recipeId: string,
  userId: string,
  supabase: SupabaseClient
): Promise<Recipe | null> {
  const { data, error } = await supabase
    .from("recipes")
    .select(
      `
      *,
      recipe_tags(
        tags(id, name, created_at)
      )
    `
    )
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
 * Handles tag creation and association automatically
 * @param userId - Owner of the recipe
 * @param recipeData - Recipe data from request
 * @param supabase - Supabase client
 * @returns Created Recipe object with tags
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

  // Handle tags if provided
  if (recipeData.tag_names && recipeData.tag_names.length > 0) {
    const tags = await getOrCreateTags(userId, recipeData.tag_names, supabase);
    await associateTags(recipe.id, tags, supabase);
  }

  // Fetch complete recipe with tags
  const completeRecipe = await getRecipeById(recipe.id, userId, supabase);
  if (!completeRecipe) throw new Error("Failed to fetch created recipe");

  return completeRecipe;
}

/**
 * Update a recipe (full replacement)
 * Replaces all fields and tag associations
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
  const { error: updateError } = await supabase
    .from("recipes")
    .update({
      title: recipeData.title,
      summary: recipeData.summary || null,
      ingredients: recipeData.ingredients,
      preparation: recipeData.preparation,
      updated_at: new Date().toISOString(),
    })
    .eq("id", recipeId)
    .eq("owner_id", userId);

  if (updateError) throw updateError;

  // Handle tags: delete old, create new
  await supabase.from("recipe_tags").delete().eq("recipe_id", recipeId);

  if (recipeData.tag_names && recipeData.tag_names.length > 0) {
    const tags = await getOrCreateTags(userId, recipeData.tag_names, supabase);
    await associateTags(recipeId, tags, supabase);
  }

  return await getRecipeById(recipeId, userId, supabase);
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
  const { error: updateError } = await supabase
    .from("recipes")
    .update(updateData)
    .eq("id", recipeId)
    .eq("owner_id", userId);

  if (updateError) throw updateError;

  // Handle tags if provided
  if (recipeData.tag_names !== undefined) {
    await supabase.from("recipe_tags").delete().eq("recipe_id", recipeId);

    if (recipeData.tag_names.length > 0) {
      const tags = await getOrCreateTags(userId, recipeData.tag_names, supabase);
      await associateTags(recipeId, tags, supabase);
    }
  }

  return await getRecipeById(recipeId, userId, supabase);
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
