import type { APIRoute } from "astro";
import { AuthService } from "../../../lib/services/auth.service";
import type { ApiError } from "../../../types";

export const prerender = false;

/**
 * POST /api/auth/logout
 * Sign out the current user
 */
export const POST: APIRoute = async ({ locals }) => {
  try {
    // Attempt logout
    const { error } = await AuthService.signOut({ locals } as any);

    if (error) {
      console.error("Logout error:", error);
      const errorResponse: ApiError = {
        error: "Logout failed",
        message: "Wystąpił błąd podczas wylogowywania.",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Logout successful
    return new Response(
      JSON.stringify({
        success: true,
        message: "Wylogowano pomyślnie",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Logout error:", error);
    const errorResponse: ApiError = {
      error: "Internal server error",
      message: "Wystąpił błąd podczas wylogowywania.",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
