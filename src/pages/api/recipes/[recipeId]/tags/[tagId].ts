import type { APIRoute } from "astro";
import { UuidSchema } from "../../../../../lib/validation/tags.schemas";
import { removeTagFromRecipe } from "../../../../../lib/services/tags.service";
import type { ApiError } from "../../../../../types";

export const prerender = false;

export const DELETE: APIRoute = async ({ params, locals }) => {
  const userId = locals.user.id;

  // Validate recipeId and tagId
  let recipeId: string;
  let tagId: string;
  try {
    recipeId = UuidSchema.parse(params.recipeId);
    tagId = UuidSchema.parse(params.tagId);
  } catch {
    const errorResponse: ApiError = {
      error: "Invalid UUID",
      message: "Invalid recipe ID or tag ID format",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    await removeTagFromRecipe(userId, recipeId, tagId, locals.supabase);

    // 204 No Content - empty response
    return new Response(null, {
      status: 204,
    });
  } catch (error: unknown) {
    console.error(`Error removing tag ${tagId} from recipe ${recipeId}:`, error);

    // Handle specific errors
    if (error instanceof Error && (error.message?.includes("not found") || error.message?.includes("not associated"))) {
      const errorResponse: ApiError = {
        error: "Association not found",
        message: "Tag is not associated with this recipe",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generic error
    const errorResponse: ApiError = {
      error: "Internal server error",
      message: "Failed to remove tag. Please try again later.",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
