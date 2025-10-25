import type { APIRoute } from "astro";
import { z } from "zod";
import { TagSearchQuerySchema } from "../../../lib/validation/tags.schemas";
import { getUserTags } from "../../../lib/services/tags.service";
import type { ApiError, TagListResponse } from "../../../types";

export const prerender = false;

export const GET: APIRoute = async ({ url, locals }) => {
  const userId = locals.user.id;

  // Parse query params
  let search: string | undefined;
  try {
    const params = TagSearchQuerySchema.parse({
      search: url.searchParams.get("search") || undefined,
    });
    search = params.search;
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
  }

  try {
    const tags = await getUserTags(userId, locals.supabase, search);
    const response: TagListResponse = { tags };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching tags:", error);
    const errorResponse: ApiError = {
      error: "Internal server error",
      message: "Failed to fetch tags. Please try again later.",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
