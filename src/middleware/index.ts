import { defineMiddleware } from "astro:middleware";
import { createServerSupabaseClient } from "../db/supabase.client";

const PUBLIC_ROUTES = ["/login", "/register", "/onboarding", "/reset-password"];

const API_PREFIX = "/api/";

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = new URL(context.request.url);

  // Skip auth for public routes and API endpoints
  if (PUBLIC_ROUTES.includes(pathname) || pathname.startsWith(API_PREFIX)) {
    const supabase = createServerSupabaseClient(context);
    context.locals.supabase = supabase;
    return next();
  }

  // DEVELOPMENT: Temporarily bypass auth for dashboard testing
  // Remove this when login page is implemented
  if (pathname === "/") {
    const supabase = createServerSupabaseClient(context);
    context.locals.supabase = supabase;

    // Create a mock user for development
    context.locals.user = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "dev@example.com",
      user_metadata: { display_name: "Dev User" },
      app_metadata: {},
      aud: "authenticated",
      created_at: new Date().toISOString(),
    };
    return next();
  }

  const supabase = createServerSupabaseClient(context);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const intendedPath = pathname;
    return context.redirect(`/login?redirect=${encodeURIComponent(intendedPath)}`);
  }

  // Store user in locals
  context.locals.user = user;
  context.locals.supabase = supabase;

  // For dashboard (/), check onboarding
  if (pathname === "/") {
    const { data: preferences } = await supabase
      .from("user_preferences")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!preferences) {
      return context.redirect("/onboarding");
    }
  }

  return next();
});
