import type { Database } from "./db/database.types";

type SmartRecipeMateSchema = Database["smart_recipe_mate"]["Tables"];

// Base entity types from database
export type UserOnboardingEntity = SmartRecipeMateSchema["user_onboarding"]["Row"];
export type UserPreferencesEntity = SmartRecipeMateSchema["user_preferences"]["Row"];
export type RecipeEntity = SmartRecipeMateSchema["recipes"]["Row"];
export type TagEntity = SmartRecipeMateSchema["tags"]["Row"];
export type RecipeTagEntity = SmartRecipeMateSchema["recipe_tags"]["Row"];
export type AIGenerationEntity = SmartRecipeMateSchema["ai_generations"]["Row"];

// =============================================================================
// 1. ONBOARDING DTOs
// =============================================================================

export type OnboardingStatus = UserOnboardingEntity;

export interface PreferencesInput {
  diet_type: string;
  preferred_ingredients?: string;
  preferred_cuisines?: string;
  allergens?: string;
  notes?: string;
}

export interface OnboardingUpdateInput {
  current_step: number;
  preferences?: PreferencesInput;
}

export interface OnboardingCompleteInput {
  preferences: PreferencesInput;
}

export interface OnboardingCompleteResponse {
  user_id: string;
  current_step: number;
  completed_at: string;
  created_at: string;
  preferences: UserPreferences;
}

// =============================================================================
// 2. USER PREFERENCES DTOs
// =============================================================================

export type UserPreferences = UserPreferencesEntity;

export type PreferencesUpdateInput = PreferencesInput;

export type PreferencesPartialUpdateInput = Partial<PreferencesInput>;

// =============================================================================
// 3. RECIPES DTOs
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
// 4. TAGS DTOs
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
// 5. AI GENERATION DTOs
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
// 6. COMMON DTOs
// =============================================================================

/**
 * Standard API error response format
 * Used for all error responses (4xx, 5xx)
 */
export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Rate limit error response (429)
 * Extends ApiError with retry_after field
 */
export type RateLimitError = ApiError & {
  retry_after: number;
};
