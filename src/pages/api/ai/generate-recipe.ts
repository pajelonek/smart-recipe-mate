import type { APIRoute } from "astro";
import { z } from "zod";
import { AIGenerateRecipeInputSchema } from "../../../lib/validation/ai-generation.schemas";
import {
  createAIGeneration,
  updateAIGenerationSuccess,
  updateAIGenerationError,
} from "../../../lib/services/ai-generation.service";
import { getUserPreferences } from "../../../lib/services/preferences.service";
import { generateRecipe, generateSuggestions } from "../../../lib/services/openrouter.service";
import type { ApiError, AIGenerateRecipeResponse, AIGenerateRecipeErrorResponse } from "../../../types";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  // TODO: Add authentication when ready
  const testUserId = "00000000-0000-0000-0000-000000000000";

  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch {
    const errorResponse: ApiError = {
      error: "Invalid JSON",
      message: "Request body must be valid JSON",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let validatedData;
  try {
    validatedData = AIGenerateRecipeInputSchema.parse(requestBody);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorResponse: ApiError = {
        error: "Validation failed",
        message: error.errors[0].message,
        details: { fields: error.errors },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    throw error;
  }

  try {
    const preferences = await getUserPreferences(testUserId, locals.supabase);
    if (!preferences) {
      const errorResponse: ApiError = {
        error: "Preferences not found",
        message: "User has not completed onboarding. Please complete your profile first.",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const inputPayload = {
      ...validatedData,
      user_preferences: {
        diet_type: preferences.diet_type,
        preferred_ingredients: preferences.preferred_ingredients,
        preferred_cuisines: preferences.preferred_cuisines,
        allergens: preferences.allergens,
        notes: preferences.notes || undefined,
      },
    };

    const generationId = await createAIGeneration(testUserId, inputPayload, locals.supabase);

    try {
      // NOTE: Using mock implementation - API key not required
      const apiKey = import.meta.env.OPENROUTER_API_KEY || "mock-api-key";

      const recipe = await generateRecipe(inputPayload, apiKey);

      const generation = await updateAIGenerationSuccess(generationId, recipe, locals.supabase);

      const response: AIGenerateRecipeResponse = {
        generation_id: generationId,
        recipe,
        input_payload: inputPayload,
        created_at: generation.created_at,
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (aiError) {
      const errorMessage = aiError instanceof Error ? aiError.message : "Unknown AI error";

      await updateAIGenerationError(generationId, errorMessage, locals.supabase);

      // Check if it's a "no recipe" situation (422) or technical error (500)
      if (
        errorMessage.toLowerCase().includes("insufficient") ||
        errorMessage.toLowerCase().includes("cannot generate") ||
        errorMessage.toLowerCase().includes("unable to")
      ) {
        // AI couldn't generate recipe - provide suggestions
        const suggestions = generateSuggestions(validatedData.available_ingredients, preferences);

        const errorResponse: AIGenerateRecipeErrorResponse = {
          error: "No recipe generated",
          message:
            "Unable to generate a recipe with the provided ingredients and preferences. Try adding more ingredients or adjusting dietary requirements.",
          generation_id: generationId,
          suggestions,
        };

        return new Response(JSON.stringify(errorResponse), {
          status: 422,
          headers: { "Content-Type": "application/json" },
        });
      }

      console.error("AI generation error:", {
        userId: testUserId,
        generationId,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });

      const errorResponse: ApiError = {
        error: "AI service error",
        message: "Failed to generate recipe. The error has been logged.",
        details: { generation_id: generationId },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    // Unexpected error in the flow
    console.error("Error in generate-recipe endpoint:", error);
    const errorResponse: ApiError = {
      error: "Internal server error",
      message: "Failed to process request. Please try again later.",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
