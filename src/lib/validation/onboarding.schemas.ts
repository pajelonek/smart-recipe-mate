import { z } from "zod";

/**
 * Validation schema for POST /api/onboarding/complete
 * Completes the onboarding by creating user preferences
 * Requires diet_type, other preference fields are optional
 */
export const OnboardingCompleteInputSchema = z.object({
  preferences: z.object({
    diet_type: z.string().min(1, "diet_type is required").max(50, "diet_type must be at most 50 characters"),
    preferred_ingredients: z
      .string()
      .max(1000, "preferred_ingredients must be at most 1000 characters")
      .optional()
      .default(""),
    preferred_cuisines: z.string().max(500, "preferred_cuisines must be at most 500 characters").optional().default(""),
    allergens: z.string().max(500, "allergens must be at most 500 characters").optional().default(""),
    notes: z.string().max(2000, "notes must be at most 2000 characters").optional(),
  }),
});
