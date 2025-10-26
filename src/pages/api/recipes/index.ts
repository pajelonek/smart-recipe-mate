import type { APIRoute } from "astro";
import { z } from "zod";
import { RecipeCreateInputSchema } from "../../../lib/validation/recipes.schemas";
import { getUserRecipes, createRecipe } from "../../../lib/services/recipes.service";
import type { ApiError, RecipeListResponse } from "../../../types";

export const prerender = false;

/**
 * GET /api/recipes
 * List all recipes for authenticated user
 * Returns recipes sorted by creation date (newest first)
 */
export const GET: APIRoute = async ({ locals }) => {
  const userId = locals.user.id;

  try {
    const recipes = await getUserRecipes(userId, locals.supabase);

    const response: RecipeListResponse = { recipes };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching recipes:", error);
    const errorResponse: ApiError = {
      error: "Internal server error",
      message: "Failed to fetch recipes. Please try again later.",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * POST /api/recipes
 * Create a new recipe
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const userId = locals.user.id;

  // Parse JSON body
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

  // Validate input
  let validatedData;
  try {
    validatedData = RecipeCreateInputSchema.parse(requestBody);
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

  // Create recipe
  try {
    const recipe = await createRecipe(userId, validatedData, locals.supabase);

    return new Response(JSON.stringify(recipe), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating recipe:", error);
    const errorResponse: ApiError = {
      error: "Internal server error",
      message: "Failed to create recipe. Please try again later.",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
