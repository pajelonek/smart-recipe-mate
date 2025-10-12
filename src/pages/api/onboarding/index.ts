import type { APIRoute } from "astro";
import { z } from "zod";
import { OnboardingUpdateInputSchema } from "../../../lib/validation/onboarding.schemas";
import { getOnboardingStatus, updateOnboardingProgress } from "../../../lib/services/onboarding.service";
import type { ApiError } from "../../../types";

export const prerender = false;

/**
 * GET /api/onboarding
 * Retrieves the current onboarding status for a user
 * Returns 404 if onboarding has not been started
 */
export const GET: APIRoute = async ({ locals }) => {
  // TODO: Add authentication when ready
  const testUserId = "00000000-0000-0000-0000-000000000000";

  try {
    const onboarding = await getOnboardingStatus(testUserId, locals.supabase);

    if (!onboarding) {
      const errorResponse: ApiError = {
        error: "Onboarding not started",
        message: "No onboarding record found for user",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(onboarding), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching onboarding status:", error);
    const errorResponse: ApiError = {
      error: "Internal server error",
      message: "Failed to fetch onboarding status. Please try again later.",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * PATCH /api/onboarding
 * Updates the onboarding progress for a user
 * Creates a new onboarding record if it doesn't exist
 * Accepts current_step (1-5) and optional preferences data
 */
export const PATCH: APIRoute = async ({ request, locals }) => {
  // TODO: Add authentication when ready
  const testUserId = "00000000-0000-0000-0000-000000000000";

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

  // Validate request body
  let validatedData;
  try {
    validatedData = OnboardingUpdateInputSchema.parse(requestBody);
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

  // Update onboarding progress
  try {
    const updatedOnboarding = await updateOnboardingProgress(testUserId, validatedData.current_step, locals.supabase);

    return new Response(JSON.stringify(updatedOnboarding), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating onboarding progress:", error);
    const errorResponse: ApiError = {
      error: "Internal server error",
      message: "Failed to update onboarding progress. Please try again later.",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
