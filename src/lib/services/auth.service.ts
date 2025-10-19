import type { APIContext } from "astro";
import { createServerSupabaseClient } from "../../db/supabase.client";

/**
 * Authentication service for handling user authentication operations
 * All methods use server-side Supabase client for security
 */
export class AuthService {
  /**
   * Sign in a user with email and password
   */
  static async signIn(email: string, password: string, context: APIContext) {
    const supabase = createServerSupabaseClient(context);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  }

  /**
   * Sign up a new user
   */
  static async signUp(email: string, password: string, context: APIContext) {
    const supabase = createServerSupabaseClient(context);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${context.url.origin}/auth/callback`
      }
    });
    return { data, error };
  }

  /**
   * Sign out the current user
   */
  static async signOut(context: APIContext) {
    const supabase = createServerSupabaseClient(context);
    const { error } = await supabase.auth.signOut();
    return { error };
  }

  /**
   * Send password reset email
   */
  static async resetPassword(email: string, context: APIContext) {
    const supabase = createServerSupabaseClient(context);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${context.url.origin}/auth/update-password`
    });
    return { error };
  }

  /**
   * Update user password (typically after reset)
   */
  static async updatePassword(newPassword: string, context: APIContext) {
    const supabase = createServerSupabaseClient(context);
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    return { error };
  }

  /**
   * Get current user from session
   */
  static async getUser(context: APIContext) {
    const supabase = createServerSupabaseClient(context);
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  }

  /**
   * Get current session
   */
  static async getSession(context: APIContext) {
    const supabase = createServerSupabaseClient(context);
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  }
}
