import type { APIRoute } from "astro";
import { z } from "zod";
import { AddTagsInputSchema, UuidSchema } from "../../../../../lib/validation/tags.schemas";
import { addTagsToRecipe } from "../../../../../lib/services/tags.service";
import type { ApiError } from "../../../../../types";

export const prerender = false;

export const POST: APIRoute = async ({ params, request, locals }) => {
  // TODO: Add authentication when ready
  const testUserId = "00000000-0000-0000-0000-000000000000";

  // Validate recipeId
  let recipeId: string;
  try {
    recipeId = UuidSchema.parse(params.recipeId);
  } catch {
    const errorResponse: ApiError = {
      error: "Invalid UUID",
      message: "Invalid recipe ID format",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Parse request body
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

  // Validate request body
  let validatedData;
  try {
    validatedData = AddTagsInputSchema.parse(requestBody);
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

  // Add tags to recipe
  try {
    const result = await addTagsToRecipe(testUserId, recipeId, validatedData.tag_names, locals.supabase);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error(`Error adding tags to recipe ${recipeId}:`, error);

    // Handle specific errors
    if (error instanceof Error && error.message?.includes("not found")) {
      const errorResponse: ApiError = {
        error: "Recipe not found",
        message: "Recipe does not exist or has been deleted",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (error instanceof Error && error.message?.includes("Tag limit exceeded")) {
      const errorResponse: ApiError = {
        error: "Tag limit exceeded",
        message: error.message,
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 422,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generic error
    const errorResponse: ApiError = {
      error: "Internal server error",
      message: "Failed to add tags. Please try again later.",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
