import type { APIRoute } from "astro";
import { resetPasswordSchema } from "../../../lib/validation/auth.schemas";
import { AuthService } from "../../../lib/services/auth.service";
import type { ApiError } from "../../../types";

export const prerender = false;

/**
 * POST /api/auth/reset-password
 * Send password reset email
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse and validate request body
    const body = await request.json();

    const validationResult = resetPasswordSchema.safeParse(body);
    if (!validationResult.success) {
      const errorResponse: ApiError = {
        error: "Validation error",
        message: "Nieprawidłowy format adresu email",
        details: validationResult.error.issues,
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { email } = validationResult.data;

    // Send reset password email
    const { error } = await AuthService.resetPassword(email, { locals } as any);

    if (error) {
      // For security reasons, don't reveal if email exists or not
      // Always return success message
      console.warn("Password reset error:", error);
    }

    // Always return success for security (don't reveal if email exists)
    return new Response(
      JSON.stringify({
        success: true,
        message: "Jeśli podany adres email jest zarejestrowany, otrzymasz link do resetowania hasła.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    const errorResponse: ApiError = {
      error: "Internal server error",
      message: "Wystąpił błąd podczas wysyłania linku resetującego.",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
