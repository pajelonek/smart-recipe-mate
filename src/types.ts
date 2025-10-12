import type { Database } from "./db/database.types";

type PublicSchema = Database["public"]["Tables"];

// Base entity types from database
export type UserPreferencesEntity = PublicSchema["user_preferences"]["Row"];
export type RecipeEntity = PublicSchema["recipes"]["Row"];
export type TagEntity = PublicSchema["tags"]["Row"];
export type RecipeTagEntity = PublicSchema["recipe_tags"]["Row"];
export type AIGenerationEntity = PublicSchema["ai_generations"]["Row"];

// =============================================================================
// 1. ONBOARDING / USER PREFERENCES DTOs
// =============================================================================

export interface PreferencesInput {
  diet_type: string;
  preferred_ingredients?: string;
  preferred_cuisines?: string;
  allergens?: string;
  notes?: string;
}

export type UserPreferences = UserPreferencesEntity;

export type PreferencesUpdateInput = PreferencesInput;

export type PreferencesPartialUpdateInput = Partial<PreferencesInput>;

// =============================================================================
// 2. RECIPES DTOs
// =============================================================================

export type Tag = Pick<TagEntity, "id" | "name" | "created_at">;

export type Recipe = Omit<RecipeEntity, "deleted_at"> & {
  tags: Tag[];
};

export interface RecipeListResponse {
  recipes: Recipe[];
}

export interface RecipeCreateInput {
  title: string;
  summary?: string;
  ingredients: string;
  preparation: string;
  tag_names?: string[];
}

export type RecipeUpdateInput = RecipeCreateInput;

export type RecipePartialUpdateInput = Partial<RecipeCreateInput>;

// =============================================================================
// 3. TAGS DTOs
// =============================================================================

export type TagWithCount = Tag & {
  owner_id: string;
  recipe_count: number;
};

export interface TagListResponse {
  tags: TagWithCount[];
}

export interface AddTagsInput {
  tag_names: string[];
}

export interface AddTagsResponse {
  recipe_id: string;
  tags: Tag[];
  message: string;
}

// =============================================================================
// 4. AI GENERATION DTOs
// =============================================================================

export interface AIGeneratedRecipe {
  title: string;
  summary: string;
  ingredients: string;
  preparation: string;
}

export interface AIGenerateRecipeInput {
  available_ingredients: string[];
  dietary_goals?: string;
  additional_context?: string;
}

export type AIInputPayload = AIGenerateRecipeInput & {
  user_preferences: PreferencesInput;
};

export interface AIGenerateRecipeResponse {
  generation_id: string;
  recipe: AIGeneratedRecipe;
  input_payload: AIInputPayload;
  created_at: string;
}

export interface AIGenerateRecipeErrorResponse {
  error: string;
  message: string;
  generation_id: string;
  suggestions: string[];
}

export type AIGeneration = AIGenerationEntity;

export interface AIGenerationListResponse {
  generations: AIGeneration[];
}

// =============================================================================
// 5. COMMON DTOs
// =============================================================================

export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}
