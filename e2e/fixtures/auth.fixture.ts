/* eslint-disable react-hooks/rules-of-hooks, no-console */
/**
 * Note: The `use` function in Playwright fixtures is not a React hook,
 * it's a Playwright fixture callback function for setup/teardown.
 * The eslint-disable comment above is needed to prevent false positives.
 */
import { test as base } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";

/**
 * Test fixture for authentication helpers
 * Provides utilities for creating/deleting test users and managing sessions
 *
 * Uses cloud Supabase project for E2E testing.
 * Environment variables should be set in .env.test file:
 * - SUPABASE_URL (your cloud project URL, e.g., https://xxxxx.supabase.co)
 * - SUPABASE_SERVICE_ROLE_KEY (service role key from Supabase dashboard - keep secret!)
 *
 * Note: We use service role key for all operations in tests (including database operations)
 * to avoid RLS restrictions and simplify test setup.
 */
interface AuthFixtures {
  supabase: SupabaseClient;
  createTestUser: (email: string, password: string) => Promise<{ userId: string; email: string }>;
  createTestUserWithPreferences: (
    email: string,
    password: string,
    preferences?: { diet_type?: string }
  ) => Promise<{ userId: string; email: string }>;
  deleteTestUser: (email: string) => Promise<void>;
}

// Use cloud Supabase for E2E testing
const supabaseUrl = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Validate required environment variables
if (!supabaseUrl) {
  throw new Error(
    "SUPABASE_URL is required for E2E tests. " +
      "Please add it to your .env.test file with your cloud Supabase project URL."
  );
}

if (!supabaseServiceKey) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY is required for E2E tests. " +
      "Please add it to your .env.test file. " +
      "You can find it in your Supabase project dashboard under Settings > API. " +
      "⚠️ Keep this key secret - never commit it to version control!"
  );
}

// Create a single admin Supabase client for all test operations
const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

export const test = base.extend<AuthFixtures>({
  supabase: async ({}, use) => {
    // Use service role key for database operations in tests (bypasses RLS)
    await use(adminSupabase);
  },

  createTestUser: async ({}, use) => {
    const createdUsers: string[] = [];

    await use(async (email: string, password: string) => {
      const { data, error } = await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email for testing
      });

      if (error) {
        throw new Error(`Failed to create test user: ${error.message}`);
      }

      if (data.user) {
        createdUsers.push(data.user.id);
      }

      return {
        userId: data.user?.id || "",
        email: data.user?.email || email,
      };
    });

    // Cleanup after test
    for (const userId of createdUsers) {
      try {
        await adminSupabase.auth.admin.deleteUser(userId);
      } catch (error) {
        console.warn(`Failed to delete test user ${userId}:`, error);
      }
    }
  },

  createTestUserWithPreferences: async ({}, use) => {
    const createdUsers: string[] = [];

    await use(async (email: string, password: string, preferences?: { diet_type?: string }) => {
      // Create user
      const { data, error } = await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email for testing
      });

      if (error) {
        throw new Error(`Failed to create test user: ${error.message}`);
      }

      if (!data.user) {
        throw new Error("User creation succeeded but no user data returned");
      }

      createdUsers.push(data.user.id);

      // Create preferences (default to omnivore if not specified)
      const userPreferences = preferences || { diet_type: "omnivore" };
      const { error: prefError } = await adminSupabase.from("user_preferences").insert({
        user_id: data.user.id,
        ...userPreferences,
      });

      if (prefError) {
        throw new Error(`Failed to create preferences: ${prefError.message}`);
      }

      return {
        userId: data.user.id,
        email: data.user.email || email,
      };
    });

    // Cleanup after test
    for (const userId of createdUsers) {
      try {
        await adminSupabase.auth.admin.deleteUser(userId);
      } catch (error) {
        console.warn(`Failed to delete test user ${userId}:`, error);
      }
    }
  },

  deleteTestUser: async ({}, use) => {
    await use(async (email: string) => {
      // Find user by email
      const { data: users, error: listError } = await adminSupabase.auth.admin.listUsers();
      if (listError) {
        throw new Error(`Failed to list users: ${listError.message}`);
      }

      const user = users.users.find((u) => u.email === email);
      if (user) {
        const { error } = await adminSupabase.auth.admin.deleteUser(user.id);
        if (error) {
          throw new Error(`Failed to delete user: ${error.message}`);
        }
      }
    });
  },
});

export { expect } from "@playwright/test";
