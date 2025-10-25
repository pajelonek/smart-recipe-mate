import type { APIRoute } from "astro";
import { z } from "zod";
import {
  uuidSchema,
  RecipeUpdateInputSchema,
  RecipePartialUpdateInputSchema,
} from "../../../lib/validation/recipes.schemas";
import { getRecipeById, updateRecipe, patchRecipe, deleteRecipe } from "../../../lib/services/recipes.service";
import type { ApiError } from "../../../types";

export const prerender = false;

/**
 * GET /api/recipes/:id
 * Get a single recipe by ID
 * Returns recipe with expanded tags or 404 if not found/deleted
 */
export const GET: APIRoute = async ({ params, locals }) => {
  const userId = locals.user.id;

  // Validate recipe ID
  let recipeId: string;
  try {
    recipeId = uuidSchema.parse(params.id);
  } catch {
    const errorResponse: ApiError = {
      error: "Invalid ID",
      message: "Recipe ID must be a valid UUID",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const recipe = await getRecipeById(recipeId, userId, locals.supabase);

    if (!recipe) {
      const errorResponse: ApiError = {
        error: "Recipe not found",
        message: "Recipe does not exist or has been deleted",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(recipe), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching recipe:", error);
    const errorResponse: ApiError = {
      error: "Internal server error",
      message: "Failed to fetch recipe. Please try again later.",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * PUT /api/recipes/:id
 * Full recipe update (replaces all fields)
 * Requires all mandatory fields (title, ingredients, preparation)
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
  const userId = locals.user.id;

  // Validate recipe ID
  let recipeId: string;
  try {
    recipeId = uuidSchema.parse(params.id);
  } catch {
    const errorResponse: ApiError = {
      error: "Invalid ID",
      message: "Recipe ID must be a valid UUID",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

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
    validatedData = RecipeUpdateInputSchema.parse(requestBody);
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

  // Update recipe
  try {
    const recipe = await updateRecipe(recipeId, userId, validatedData, locals.supabase);

    if (!recipe) {
      const errorResponse: ApiError = {
        error: "Recipe not found",
        message: "Recipe does not exist or has been deleted",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(recipe), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating recipe:", error);
    const errorResponse: ApiError = {
      error: "Internal server error",
      message: "Failed to update recipe. Please try again later.",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * PATCH /api/recipes/:id
 * Partial recipe update (updates only provided fields)
 * At least one field must be provided
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const userId = locals.user.id;

  // Validate recipe ID
  let recipeId: string;
  try {
    recipeId = uuidSchema.parse(params.id);
  } catch {
    const errorResponse: ApiError = {
      error: "Invalid ID",
      message: "Recipe ID must be a valid UUID",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

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
    validatedData = RecipePartialUpdateInputSchema.parse(requestBody);
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

  // Patch recipe
  try {
    const recipe = await patchRecipe(recipeId, userId, validatedData, locals.supabase);

    if (!recipe) {
      const errorResponse: ApiError = {
        error: "Recipe not found",
        message: "Recipe does not exist or has been deleted",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(recipe), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error patching recipe:", error);
    const errorResponse: ApiError = {
      error: "Internal server error",
      message: "Failed to update recipe. Please try again later.",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * DELETE /api/recipes/:id
 * Soft delete a recipe (sets deleted_at timestamp)
 * Returns 204 No Content on success
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  const userId = locals.user.id;

  // Validate recipe ID
  let recipeId: string;
  try {
    recipeId = uuidSchema.parse(params.id);
  } catch {
    const errorResponse: ApiError = {
      error: "Invalid ID",
      message: "Recipe ID must be a valid UUID",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Delete recipe
  try {
    const deleted = await deleteRecipe(recipeId, userId, locals.supabase);

    if (!deleted) {
      const errorResponse: ApiError = {
        error: "Recipe not found",
        message: "Recipe does not exist or has already been deleted",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    console.error("Error deleting recipe:", error);
    const errorResponse: ApiError = {
      error: "Internal server error",
      message: "Failed to delete recipe. Please try again later.",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
