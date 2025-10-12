import type { SupabaseClient } from "../../db/supabase.client";
import type { TagWithCount, AddTagsResponse, Tag } from "../../types";
import type { Tables } from "../../db/database.types";

type TagEntity = Tables<"tags">;

/**
 * Get all tags for a user with recipe count and optional search filter
 * Uses a single query with LEFT JOIN for optimal performance
 */
export async function getUserTags(userId: string, supabase: SupabaseClient, search?: string): Promise<TagWithCount[]> {
  // Build query with LEFT JOIN to count recipes
  let query = supabase
    .from("tags")
    .select("id, owner_id, name, created_at, recipe_tags(recipe_id)")
    .eq("owner_id", userId)
    .order("name", { ascending: true });

  // Apply search filter if provided
  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data: tags, error } = await query;

  if (error) {
    throw error;
  }

  // Map results and count recipe_tags for each tag
  const tagsWithCount: TagWithCount[] = tags.map((tag) => {
    const recipeTags = tag.recipe_tags as { recipe_id: string }[] | null;
    return {
      id: tag.id,
      owner_id: tag.owner_id,
      name: tag.name,
      created_at: tag.created_at,
      recipe_count: recipeTags ? recipeTags.length : 0,
    };
  });

  return tagsWithCount;
}

/**
 * Add tags to a recipe (creates new tags if they don't exist)
 */
export async function addTagsToRecipe(
  userId: string,
  recipeId: string,
  tagNames: string[],
  supabase: SupabaseClient
): Promise<AddTagsResponse> {
  // Validate recipe ownership
  const recipeExists = await validateRecipeOwnership(userId, recipeId, supabase);
  if (!recipeExists) {
    throw new Error("Recipe not found or access denied");
  }

  // Get current tag count for the recipe
  const currentTagCount = await getRecipeTagCount(recipeId, supabase);

  // Check if adding new tags would exceed the limit
  if (currentTagCount + tagNames.length > 10) {
    throw new Error(
      `Tag limit exceeded. Recipe already has ${currentTagCount} tags. Remove some tags before adding new ones.`
    );
  }

  // Get or create tags
  const tags = await getOrCreateTags(userId, tagNames, supabase);

  // Create recipe_tags associations (idempotent with ON CONFLICT DO NOTHING)
  const recipeTagsToInsert = tags.map((tag) => ({
    recipe_id: recipeId,
    tag_id: tag.id,
  }));

  const { error: insertError } = await supabase
    .from("recipe_tags")
    .upsert(recipeTagsToInsert, { onConflict: "recipe_id,tag_id", ignoreDuplicates: true });

  if (insertError) {
    throw insertError;
  }

  // Fetch all tags for the recipe to return
  const { data: recipeTags, error: fetchError } = await supabase
    .from("recipe_tags")
    .select("tag_id")
    .eq("recipe_id", recipeId);

  if (fetchError) {
    throw fetchError;
  }

  const tagIds = recipeTags.map((rt) => rt.tag_id);

  const { data: allTags, error: tagsError } = await supabase
    .from("tags")
    .select("id, name, created_at")
    .in("id", tagIds);

  if (tagsError) {
    throw tagsError;
  }

  return {
    recipe_id: recipeId,
    tags: allTags as Tag[],
    message: "Tags added successfully",
  };
}

/**
 * Remove a tag from a recipe
 */
export async function removeTagFromRecipe(
  userId: string,
  recipeId: string,
  tagId: string,
  supabase: SupabaseClient
): Promise<void> {
  // Validate recipe ownership
  const recipeExists = await validateRecipeOwnership(userId, recipeId, supabase);
  if (!recipeExists) {
    throw new Error("Recipe not found or access denied");
  }

  // Delete the recipe_tags association
  const { error, count } = await supabase
    .from("recipe_tags")
    .delete({ count: "exact" })
    .eq("recipe_id", recipeId)
    .eq("tag_id", tagId);

  if (error) {
    throw error;
  }

  // Check if any rows were deleted
  if (count === 0) {
    throw new Error("Tag is not associated with this recipe");
  }
}

/**
 * Get or create tags (handles uniqueness per user)
 */
async function getOrCreateTags(userId: string, tagNames: string[], supabase: SupabaseClient): Promise<TagEntity[]> {
  const tags: TagEntity[] = [];

  for (const tagName of tagNames) {
    const trimmedName = tagName.trim();
    const tag = await getOrCreateSingleTag(userId, trimmedName, supabase);
    tags.push(tag);
  }

  return tags;
}

/**
 * Get or create a single tag for a user
 */
async function getOrCreateSingleTag(userId: string, tagName: string, supabase: SupabaseClient): Promise<TagEntity> {
  // Try to find existing tag (case-insensitive)
  const existingTag = await findExistingTag(userId, tagName, supabase);
  if (existingTag) {
    return existingTag;
  }

  // Tag doesn't exist, create it
  return await createNewTag(userId, tagName, supabase);
}

/**
 * Find existing tag by name (case-insensitive)
 */
async function findExistingTag(userId: string, tagName: string, supabase: SupabaseClient): Promise<TagEntity | null> {
  const { data: existingTags, error: selectError } = await supabase
    .from("tags")
    .select("*")
    .eq("owner_id", userId)
    .ilike("name", tagName)
    .limit(1);

  if (selectError) {
    throw selectError;
  }

  return existingTags && existingTags.length > 0 ? existingTags[0] : null;
}

/**
 * Create a new tag, handling race conditions
 */
async function createNewTag(userId: string, tagName: string, supabase: SupabaseClient): Promise<TagEntity> {
  const { data: newTag, error: insertError } = await supabase
    .from("tags")
    .insert({
      owner_id: userId,
      name: tagName,
    })
    .select()
    .single();

  if (insertError) {
    // Handle unique constraint violation (race condition)
    if (insertError.code === "23505") {
      const existingTag = await findExistingTag(userId, tagName, supabase);
      if (existingTag) {
        return existingTag;
      }
    }
    throw insertError;
  }

  return newTag;
}

/**
 * Validate recipe ownership and existence
 */
async function validateRecipeOwnership(userId: string, recipeId: string, supabase: SupabaseClient): Promise<boolean> {
  const { data, error } = await supabase
    .from("recipes")
    .select("id")
    .eq("id", recipeId)
    .eq("owner_id", userId)
    .is("deleted_at", null)
    .single();

  if (error) {
    // PostgreSQL error code 'PGRST116' means no rows returned
    if (error.code === "PGRST116") {
      return false;
    }
    throw error;
  }

  return !!data;
}

/**
 * Count current tags for a recipe
 */
async function getRecipeTagCount(recipeId: string, supabase: SupabaseClient): Promise<number> {
  const { count, error } = await supabase
    .from("recipe_tags")
    .select("*", { count: "exact", head: true })
    .eq("recipe_id", recipeId);

  if (error) {
    throw error;
  }

  return count || 0;
}
