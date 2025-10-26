import { z } from "zod";

/**
 * UUID validation helper
 * Validates recipe IDs in path parameters
 */
export const uuidSchema = z.string().uuid("Invalid recipe ID format");

/**
 * Validation schema for recipe creation (POST request)
 * Requires title, ingredients, and preparation
 * Optional: summary
 */
export const RecipeCreateInputSchema = z.object({
  title: z.string().min(1, "title is required").max(200, "title must be at most 200 characters"),
  summary: z.string().max(500, "summary must be at most 500 characters").optional(),
  ingredients: z
    .string()
    .min(10, "ingredients must be at least 10 characters")
    .max(5000, "ingredients must be at most 5000 characters"),
  preparation: z
    .string()
    .min(10, "preparation must be at least 10 characters")
    .max(10000, "preparation must be at most 10000 characters"),
});

/**
 * Validation schema for full recipe update (PUT request)
 * Same requirements as create - all fields must be provided
 */
export const RecipeUpdateInputSchema = RecipeCreateInputSchema;

/**
 * Validation schema for partial recipe update (PATCH request)
 * All fields are optional, but at least one must be provided
 */
export const RecipePartialUpdateInputSchema = z
  .object({
    title: z.string().min(1, "title cannot be empty").max(200, "title must be at most 200 characters").optional(),
    summary: z.string().max(500, "summary must be at most 500 characters").optional(),
    ingredients: z
      .string()
      .min(10, "ingredients must be at least 10 characters")
      .max(5000, "ingredients must be at most 5000 characters")
      .optional(),
    preparation: z
      .string()
      .min(10, "preparation must be at least 10 characters")
      .max(10000, "preparation must be at most 10000 characters")
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });
