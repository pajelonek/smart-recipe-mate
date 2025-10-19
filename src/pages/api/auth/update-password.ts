import type { APIRoute } from "astro";
import { updatePasswordSchema } from "../../../lib/validation/auth.schemas";
import type { ApiError } from "../../../types";

export const prerender = false;

/**
 * POST /api/auth/update-password
 * Update user password (typically after reset link)
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse and validate request body
    const body = await request.json();

    const validationResult = updatePasswordSchema.safeParse(body);
    if (!validationResult.success) {
      const errorResponse: ApiError = {
        error: "Validation error",
        message: "Nieprawidłowe dane nowego hasła",
        details: validationResult.error.issues,
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { password } = validationResult.data;

    // Update password
    const supabase = locals.supabase;
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      let errorMessage = "Wystąpił błąd podczas aktualizacji hasła";
      let statusCode = 400;

      if (error.message.includes("Password should be at least")) {
        errorMessage = "Hasło nie spełnia wymagań bezpieczeństwa";
      } else if (error.message.includes("Same password")) {
        errorMessage = "Nowe hasło nie może być takie samo jak stare";
      } else if (error.message.includes("Session not found")) {
        errorMessage = "Sesja wygasła. Link resetowania hasła może być nieprawidłowy.";
        statusCode = 401;
      }

      const errorResponse: ApiError = {
        error: "Password update failed",
        message: errorMessage,
      };

      return new Response(JSON.stringify(errorResponse), {
        status: statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Password update successful
    return new Response(
      JSON.stringify({
        success: true,
        message: "Hasło zostało pomyślnie zaktualizowane",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Update password error:", error);
    const errorResponse: ApiError = {
      error: "Internal server error",
      message: "Wystąpił błąd podczas aktualizacji hasła.",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
