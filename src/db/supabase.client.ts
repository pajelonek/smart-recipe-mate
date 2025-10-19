import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient as SupabaseClientType } from "@supabase/supabase-js";
import type { APIContext } from "astro";

import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL is required. Please add it to your .env file.");
}

if (!supabaseAnonKey) {
  throw new Error("SUPABASE_KEY is required. Please add it to your .env file.");
}

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
      storage: {
        getItem: (key: string) => {
          return context.cookies.get(key)?.value ?? null;
        },
        setItem: (key: string, value: string) => {
          context.cookies.set(key, value, {
            path: "/",
            maxAge: 60 * 60 * 24 * 365, // 1 year
            sameSite: "lax",
            secure: import.meta.env.PROD,
          });
        },
        removeItem: (key: string) => {
          context.cookies.delete(key, {
            path: "/",
          });
        },
      },
    },
    global: {
      headers: {
        cookie: context.request.headers.get("cookie") || "",
      },
    },
  });
}
