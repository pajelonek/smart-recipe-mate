import { defineMiddleware } from "astro:middleware";
import { createServerSupabaseClient } from "../db/supabase.client";

const PUBLIC_ROUTES = new Set([
  "/",
  "/login",
  "/register",
  "/reset-password",
  "/auth/callback",
  "/auth/update-password",
]);
const PUBLIC_API_ROUTES = new Set(["/api/auth/login", "/api/auth/register", "/api/auth/reset-password"]);
const ONBOARDING_ROUTE = "/onboarding";
const API_PREFIX = "/api/";

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = new URL(context.request.url);

  const supabase = createServerSupabaseClient(context);
  context.locals.supabase = supabase;

  // Skip auth for public routes
  if (PUBLIC_ROUTES.has(pathname)) {
    return next();
  }

  // Allow public API routes
  if (PUBLIC_API_ROUTES.has(pathname)) {
    return next();
  }

  // For other API routes, require authentication
  if (pathname.startsWith(API_PREFIX)) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Authentication required",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    context.locals.user = user;
    return next();
  }

  // For protected routes, check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const intendedPath = pathname;
    return context.redirect(`/login?redirect=${encodeURIComponent(intendedPath)}`);
  }

  // Store user in locals
  context.locals.user = user;

  // For dashboard (/), check onboarding completion
  if (pathname === "/") {
    const { data: preferences } = await supabase
      .from("user_preferences")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!preferences) {
      return context.redirect(ONBOARDING_ROUTE);
    }
  }

  return next();
});
