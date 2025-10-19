import type { APIRoute } from "astro";
import { registerSchema } from "../../../lib/validation/auth.schemas";
import { AuthService } from "../../../lib/services/auth.service";
import type { ApiError } from "../../../types";

export const prerender = false;

/**
 * POST /api/auth/register
 * Register a new user account
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse and validate request body
    const body = await request.json();

    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      const errorResponse: ApiError = {
        error: "Validation error",
        message: "Invalid registration data",
        details: validationResult.error.issues,
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { email, password } = validationResult.data;

    // Attempt registration
    const { data, error } = await AuthService.signUp(email, password, { locals } as any);

    if (error) {
      // Handle specific Supabase auth errors
      let errorMessage = "Wystąpił błąd podczas rejestracji";
      const statusCode = 400;

      if (error.message.includes("User already registered")) {
        errorMessage = "Użytkownik o podanym adresie email już istnieje";
      } else if (error.message.includes("Password should be at least")) {
        errorMessage = "Hasło nie spełnia wymagań bezpieczeństwa";
      } else if (error.message.includes("Unable to validate email address")) {
        errorMessage = "Nieprawidłowy format adresu email";
      }

      const errorResponse: ApiError = {
        error: "Registration failed",
        message: errorMessage,
      };

      return new Response(JSON.stringify(errorResponse), {
        status: statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Registration successful - user can log in immediately
    return new Response(
      JSON.stringify({
        success: true,
        message: "Rejestracja zakończona pomyślnie. Możesz się teraz zalogować.",
        user: {
          id: data.user?.id,
          email: data.user?.email,
        },
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Registration error:", error);
    const errorResponse: ApiError = {
      error: "Internal server error",
      message: "Wystąpił błąd podczas rejestracji. Spróbuj ponownie.",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
