import type { APIRoute } from "astro";
import { getGenerationById } from "../../../../lib/services/ai-generation.service";
import type { ApiError } from "../../../../types";

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  const testUserId = "f47ac10b-58cc-4372-a567-0e02b2c3d479";

  const generationId = params.id;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!generationId || !uuidRegex.test(generationId)) {
    const errorResponse: ApiError = {
      error: "Invalid ID",
      message: "Generation ID must be a valid UUID",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const generation = await getGenerationById(generationId, locals.supabase);

    if (!generation) {
      const errorResponse: ApiError = {
        error: "Generation not found",
        message: "AI generation record does not exist",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (generation.user_id !== testUserId) {
      const errorResponse: ApiError = {
        error: "Access denied",
        message: "You can only access your own AI generations",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(generation), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching generation:", error);
    const errorResponse: ApiError = {
      error: "Internal server error",
      message: "Failed to fetch generation. Please try again later.",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
