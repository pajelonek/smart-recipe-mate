import { z } from "zod";

/**
 * Validation schema for OpenRouter configuration
 */
export const OpenRouterConfigSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  baseUrl: z.string().url("Invalid base URL").optional(),
  defaultModel: z.string().min(1, "Model name cannot be empty").optional(),
});

/**
 * Validation schema for chat message
 */
export const ChatMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string().min(1, "Message content cannot be empty"),
});

/**
 * Validation schema for model parameters
 */
export const ModelParamsSchema = z.object({
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
  topP: z.number().min(0).max(1).optional(),
});

/**
 * Validation schema for recipe generation input
 */
export const GenerateRecipeInputSchema = z.object({
  userId: z.string().uuid("Invalid user ID format"),
  ingredients: z
    .array(z.string().min(1, "Ingredient cannot be empty").max(100, "Ingredient name too long"))
    .min(1, "At least one ingredient is required")
    .max(20, "Maximum 20 ingredients allowed"),
  preferences: z.any().optional(), // UserPreferences type from database
  model: z.string().min(1).optional(),
  params: ModelParamsSchema.optional(),
});

/**
 * Type inference for validated inputs
 */
export type OpenRouterConfigInput = z.infer<typeof OpenRouterConfigSchema>;
export type ChatMessageInput = z.infer<typeof ChatMessageSchema>;
export type ModelParamsInput = z.infer<typeof ModelParamsSchema>;
export type GenerateRecipeInputValidated = z.infer<typeof GenerateRecipeInputSchema>;
