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
  deleteTestUser: (email: string) => Promise<void>;
  cleanupTestUsers: () => Promise<void>;
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

export const test = base.extend<AuthFixtures>({
  supabase: async ({}, use) => {
    // Use service role key for database operations in tests (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
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
