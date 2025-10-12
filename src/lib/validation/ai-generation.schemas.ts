import { z } from "zod";

/**
 * Validation schema for AI recipe generation input
 *
 * Validates:
 * - available_ingredients: Array of 1-20 ingredients, each 1-100 characters
 * - dietary_goals: Optional string up to 500 characters
 * - additional_context: Optional string up to 1000 characters
 */
export const AIGenerateRecipeInputSchema = z.object({
  available_ingredients: z
    .array(
      z
        .string()
        .min(1, "Ingredient name cannot be empty")
        .max(100, "Ingredient name must be at most 100 characters")
        .trim()
    )
    .min(1, "At least one ingredient is required")
    .max(20, "Maximum 20 ingredients allowed"),
  dietary_goals: z.string().max(500, "Dietary goals must be at most 500 characters").trim().optional(),
  additional_context: z.string().max(1000, "Additional context must be at most 1000 characters").trim().optional(),
});

/**
 * Validation schema for AI generations list query parameters
 *
 * Validates:
 * - status: Filter by generation status (success, error, or all)
 */
export const AIGenerationsQuerySchema = z.object({
  status: z.enum(["success", "error", "all"]).optional().default("all"),
});

/**
 * Type inference for validated input
 */
export type AIGenerateRecipeInput = z.infer<typeof AIGenerateRecipeInputSchema>;
export type AIGenerationsQuery = z.infer<typeof AIGenerationsQuerySchema>;
