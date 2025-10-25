import type { APIRoute } from "astro";
import { z } from "zod";
import { AIGenerationsQuerySchema } from "../../../../lib/validation/ai-generation.schemas";
import { getUserGenerations } from "../../../../lib/services/ai-generation.service";
import type { ApiError, AIGenerationListResponse } from "../../../../types";

export const prerender = false;

export const GET: APIRoute = async ({ url, locals }) => {
  const userId = locals.user.id;

  let queryParams;
  try {
    queryParams = AIGenerationsQuerySchema.parse({
      status: url.searchParams.get("status") || "all",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorResponse: ApiError = {
        error: "Invalid query parameters",
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
    const generations = await getUserGenerations(userId, queryParams.status, locals.supabase);

    const response: AIGenerationListResponse = {
      generations,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching generations:", error);
    const errorResponse: ApiError = {
      error: "Internal server error",
      message: "Failed to fetch generations. Please try again later.",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
