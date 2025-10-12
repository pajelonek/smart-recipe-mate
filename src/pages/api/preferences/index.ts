import type { APIRoute } from "astro";
import { z } from "zod";
import { PreferencesInputSchema, PreferencesPartialInputSchema } from "../../../lib/validation/preferences.schemas";
import {
  getUserPreferences,
  updateUserPreferences,
  patchUserPreferences,
} from "../../../lib/services/preferences.service";
import type { ApiError } from "../../../types";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  // TODO: Add authentication when ready
  const testUserId = "00000000-0000-0000-0000-000000000000";

  try {
    const preferences = await getUserPreferences(testUserId, locals.supabase);

    if (!preferences) {
      const errorResponse: ApiError = {
        error: "Preferences not found",
        message: "User has not completed onboarding",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(preferences), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    const errorResponse: ApiError = {
      error: "Internal server error",
      message: "Failed to fetch preferences. Please try again later.",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const PUT: APIRoute = async ({ request, locals }) => {
  // TODO: Add authentication when ready
  const testUserId = "00000000-0000-0000-0000-000000000000";
  console.log("preferences");
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
    validatedData = PreferencesInputSchema.parse(requestBody);
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
    const updatedPreferences = await updateUserPreferences(testUserId, validatedData, locals.supabase);

    return new Response(JSON.stringify(updatedPreferences), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating preferences:", error);
    const errorResponse: ApiError = {
      error: "Internal server error",
      message: "Failed to update preferences. Please try again later.",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const PATCH: APIRoute = async ({ request, locals }) => {
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
    validatedData = PreferencesPartialInputSchema.parse(requestBody);
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
    const updatedPreferences = await patchUserPreferences(testUserId, validatedData, locals.supabase);

    if (!updatedPreferences) {
      const errorResponse: ApiError = {
        error: "Preferences not found",
        message: "Cannot update preferences that don't exist. Complete onboarding first.",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(updatedPreferences), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error patching preferences:", error);
    const errorResponse: ApiError = {
      error: "Internal server error",
      message: "Failed to update preferences. Please try again later.",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
