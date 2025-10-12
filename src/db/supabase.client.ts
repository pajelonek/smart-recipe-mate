import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient as SupabaseClientType } from "@supabase/supabase-js";
import type { APIContext } from "astro";

import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

export type SupabaseClient = SupabaseClientType<Database>;

/**
 * Creates a Supabase client configured for server-side usage in Astro.
 * This client can access cookies from the request/response for authentication.
 */
export function createServerSupabaseClient(context: APIContext) {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: "pkce",
      autoRefreshToken: true,
      detectSessionInUrl: false,
      persistSession: true,
    },
    global: {
      headers: {
        cookie: context.request.headers.get("cookie") || "",
      },
    },
  });
}
