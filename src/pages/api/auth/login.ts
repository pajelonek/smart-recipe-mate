import type { APIRoute } from "astro";
import { AuthService } from "../../../lib/services/auth.service";
import { loginSchema } from "../../../lib/validation/auth.schemas";
import type { ApiError } from "../../../types";
import type { LoginRequest } from "../../../types/auth/types";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const body = await context.request.json();

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

    const loginRequest: LoginRequest = validationResult.data;

    const { data, error } = await AuthService.signIn(loginRequest, context);

    if (error) {
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
  } catch {
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
