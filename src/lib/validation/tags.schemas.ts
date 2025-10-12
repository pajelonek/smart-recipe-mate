import { z } from "zod";

/**
 * Validation schema for tag search query parameter
 */
export const TagSearchQuerySchema = z.object({
  search: z.string().optional(),
});

/**
 * Validation schema for adding tags to a recipe
 * Validates tag_names array with proper trimming and length constraints
 */
export const AddTagsInputSchema = z.object({
  tag_names: z
    .array(z.string().trim().min(1, "Tag name cannot be empty").max(50, "Tag name must be at most 50 characters"))
    .min(1, "At least one tag is required")
    .max(10, "Maximum 10 tags can be added at once"),
});

/**
 * Validation schema for UUID format
 */
export const UuidSchema = z.string().uuid("Invalid UUID format");
