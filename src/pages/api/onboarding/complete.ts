import type { APIRoute } from "astro";
import { z } from "zod";
import { OnboardingCompleteInputSchema } from "../../../lib/validation/onboarding.schemas";
import { completeOnboarding } from "../../../lib/services/onboarding.service";
import type { ApiError } from "../../../types";

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
    const result = await completeOnboarding(testUserId, validatedData.preferences, locals.supabase);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle business rule violations
    if (error instanceof Error) {
      if (error.message === "Must be on step 5 to complete onboarding") {
        const errorResponse: ApiError = {
          error: "Cannot complete",
          message: error.message,
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (error.message === "Onboarding not started") {
        const errorResponse: ApiError = {
          error: "Onboarding not started",
          message: "No onboarding record found. Start onboarding first.",
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

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
