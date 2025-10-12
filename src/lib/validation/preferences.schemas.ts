import { z } from "zod";

/**
 * Validation schema for full preferences update (PUT request)
 * Requires diet_type, other fields are optional with defaults
 */
export const PreferencesInputSchema = z.object({
  diet_type: z.string().min(1, "diet_type is required").max(50, "diet_type must be at most 50 characters"),
  preferred_ingredients: z
    .string()
    .max(1000, "preferred_ingredients must be at most 1000 characters")
    .optional()
    .default(""),
  preferred_cuisines: z.string().max(500, "preferred_cuisines must be at most 500 characters").optional().default(""),
  allergens: z.string().max(500, "allergens must be at most 500 characters").optional().default(""),
  notes: z.string().max(2000, "notes must be at most 2000 characters").optional().default(""),
});

/**
 * Validation schema for partial preferences update (PATCH request)
 * All fields are optional, but at least one must be provided
 */
export const PreferencesPartialInputSchema = z
  .object({
    diet_type: z
      .string()
      .min(1, "diet_type cannot be empty")
      .max(50, "diet_type must be at most 50 characters")
      .optional(),
    preferred_ingredients: z.string().max(1000, "preferred_ingredients must be at most 1000 characters").optional(),
    preferred_cuisines: z.string().max(500, "preferred_cuisines must be at most 500 characters").optional(),
    allergens: z.string().max(500, "allergens must be at most 500 characters").optional(),
    notes: z.string().max(2000, "notes must be at most 2000 characters").optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });
