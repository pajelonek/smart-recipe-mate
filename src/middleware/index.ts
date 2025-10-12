import { defineMiddleware } from "astro:middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../db/database.types.ts";

export const onRequest = defineMiddleware((context, next) => {
  const supabase = createClient<Database>(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY);

  context.locals.supabase = supabase;
  return next();
});
