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
 * Uses local Supabase instance for E2E testing.
 * Environment variables should be set via:
 * - SUPABASE_URL (default: http://127.0.0.1:54321)
 * - SUPABASE_KEY or SUPABASE_ANON_KEY (from `supabase status -o env`)
 * - SUPABASE_SERVICE_ROLE_KEY (from `supabase status -o env`)
 */
interface AuthFixtures {
  supabase: SupabaseClient;
  createTestUser: (email: string, password: string) => Promise<{ userId: string; email: string }>;
  deleteTestUser: (email: string) => Promise<void>;
  cleanupTestUsers: () => Promise<void>;
}

// Use local Supabase for E2E testing
const supabaseUrl = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const supabaseAnonKey =
  process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Validate required environment variables
if (!supabaseAnonKey) {
  throw new Error(
    "SUPABASE_KEY or SUPABASE_ANON_KEY is required for E2E tests. " +
      "Please add it to your .env file. " +
      "You can get it by running: supabase status -o env"
  );
}

if (!supabaseServiceKey) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY is required for E2E tests to create/delete test users. " +
      "Please add it to your .env file. " +
      "You can get it by running: supabase status -o env"
  );
}

export const test = base.extend<AuthFixtures>({
  // @ts-expect-error - Playwright requires empty object pattern for fixtures without dependencies
  supabase: async ({}, use) => {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    await use(supabase);
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  createTestUser: async ({ supabase: _supabase }, use) => {
    const createdUsers: string[] = [];

    await use(async (email: string, password: string) => {
      // Use service role key for admin operations
      const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

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
    if (createdUsers.length > 0) {
      const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

      for (const userId of createdUsers) {
        try {
          await adminSupabase.auth.admin.deleteUser(userId);
        } catch (error) {
          console.warn(`Failed to delete test user ${userId}:`, error);
        }
      }
    }
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deleteTestUser: async ({ supabase: _supabase }, use) => {
    await use(async (email: string) => {
      const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  cleanupTestUsers: async ({ supabase: _supabase }, use) => {
    await use(async () => {
      const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

      const { data: users } = await adminSupabase.auth.admin.listUsers();
      if (users) {
        for (const user of users.users) {
          // Clean up test users (those with email matching test pattern)
          if (user.email && (user.email.includes("test@") || user.email.includes("e2e@"))) {
            try {
              await adminSupabase.auth.admin.deleteUser(user.id);
            } catch (error) {
              console.warn(`Failed to delete test user ${user.id}:`, error);
            }
          }
        }
      }
    });
  },
});

export { expect } from "@playwright/test";
