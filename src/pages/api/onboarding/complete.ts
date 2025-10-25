import type { APIRoute } from "astro";
import { z } from "zod";
import { OnboardingCompleteInputSchema } from "../../../lib/validation/onboarding.schemas";
import { createUserPreferences, getUserPreferences } from "../../../lib/services/preferences.service";
import type { ApiError } from "../../../types";

export const prerender = false;

/**
 * POST /api/onboarding/complete
 * Completes onboarding by creating user preferences
 * Can only be called once per user (returns 409 if preferences already exist)
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const userId = locals.user.id;

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
    validatedData = OnboardingCompleteInputSchema.parse(requestBody);
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
    // Check if user already has preferences (onboarding already completed)
    const existingPreferences = await getUserPreferences(userId, locals.supabase);

    if (existingPreferences) {
      const errorResponse: ApiError = {
        error: "Already onboarded",
        message: "User preferences already exist. Use PUT /api/preferences to update.",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create preferences
    const preferences = await createUserPreferences(userId, validatedData.preferences, locals.supabase);

    return new Response(JSON.stringify(preferences), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error completing onboarding:", error);
    const errorResponse: ApiError = {
      error: "Internal server error",
      message: "Failed to complete onboarding. Please try again later.",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
