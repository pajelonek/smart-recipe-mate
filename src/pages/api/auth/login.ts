import type { APIRoute } from "astro";
import { loginSchema } from "../../../lib/validation/auth.schemas";
import type { ApiError } from "../../../types";

export const prerender = false;

/**
 * POST /api/auth/login
 * Authenticate user with email and password
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse and validate request body
    const body = await request.json();

    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      const errorResponse: ApiError = {
        error: "Validation error",
        message: "Invalid email or password format",
        details: validationResult.error.issues,
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { email, password } = validationResult.data;

    // Attempt authentication
    const supabase = locals.supabase;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Handle specific Supabase auth errors
      let errorMessage: string;

      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "Nieprawidłowy email lub hasło";
      } else if (error.message.includes("Email not confirmed")) {
        errorMessage = "Email nie został potwierdzony";
      } else if (error.message.includes("Too many requests")) {
        errorMessage = "Zbyt wiele prób logowania. Spróbuj ponownie później.";
      } else {
        errorMessage = "Nieprawidłowy email lub hasło";
      }

      const errorResponse: ApiError = {
        error: "Authentication failed",
        message: errorMessage,
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Authentication successful - cookies are automatically set by Supabase client
    return new Response(
      JSON.stringify({
        success: true,
        message: "Login successful",
        user: {
          id: data.user?.id,
          email: data.user?.email,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Login error:", error);
    const errorResponse: ApiError = {
      error: "Internal server error",
      message: "Wystąpił błąd podczas logowania. Spróbuj ponownie.",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
