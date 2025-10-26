import { defineMiddleware } from "astro:middleware";
import { createServerSupabaseClient, type SupabaseClient } from "../db/supabase.client";

const PUBLIC_ROUTES = new Set([
  "/",
  "/login",
  "/register",
  "/reset-password",
  "/auth/callback",
  "/auth/update-password",
]);
const PUBLIC_API_ROUTES = new Set([
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/reset-password",
  "/api/auth/update-password",
]);
const ONBOARDING_ROUTE = "/onboarding";
const API_PREFIX = "/api/";

async function checkUserHasPreferences(userId: string, supabase: SupabaseClient): Promise<boolean> {
  const { data: preferences } = await supabase
    .from("user_preferences")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  return !!preferences;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = new URL(context.request.url);

  // Skip auth for public routes (create supabase client after to avoid cookie issues)
  if (PUBLIC_ROUTES.has(pathname)) {
    const supabase = createServerSupabaseClient(context);
    context.locals.supabase = supabase;
    return await next();
  }

  // Allow public API routes
  if (PUBLIC_API_ROUTES.has(pathname)) {
    const supabase = createServerSupabaseClient(context);
    context.locals.supabase = supabase;
    return await next();
  }

  // Create Supabase client for protected routes
  const supabase = createServerSupabaseClient(context);
  context.locals.supabase = supabase;

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
    return await next();
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

  // Check onboarding status for protected routes
  const hasPreferences = await checkUserHasPreferences(user.id, supabase);

  // For onboarding route, redirect to dashboard if already completed
  if (pathname === ONBOARDING_ROUTE) {
    if (hasPreferences) {
      return context.redirect("/");
    }
    // Allow access to onboarding if not completed
    return await next();
  }

  // For dashboard (/), redirect to onboarding if not completed
  if (pathname === "/") {
    if (!hasPreferences) {
      return context.redirect(ONBOARDING_ROUTE);
    }
    return await next();
  }

  return await next();
});
