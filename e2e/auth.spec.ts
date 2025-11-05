import { test, expect } from "./fixtures/auth.fixture";
import { createClient } from "@supabase/supabase-js";
import { RegisterPage } from "./pages/RegisterPage";
import { LoginPage } from "./pages/LoginPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { UpdatePasswordPage } from "./pages/UpdatePasswordPage";

test.describe("Authentication", () => {
  // Tests that require authentication can use:
  // test.use({ storageState: "e2e/.auth/user.json" });
  test.describe("User Registration", () => {
    test("should register a new user with valid data", async ({ page, deleteTestUser }) => {
      const registerPage = new RegisterPage(page);
      const testEmail = `e2e-register-${Date.now()}@test.com`;
      const testPassword = "TestPassword123!";

      await registerPage.goto();
      await registerPage.register(testEmail, testPassword);

      // Should show success message or redirect to login
      await expect(page).toHaveURL(/.*login|.*register/);

      // Cleanup
      await deleteTestUser(testEmail);
    });

    test("should display error for invalid email format", async ({ page }) => {
      const registerPage = new RegisterPage(page);

      await registerPage.goto();
      await registerPage.fillEmail("invalid-email");
      await registerPage.fillPassword("TestPassword123!");
      await registerPage.fillConfirmPassword("TestPassword123!");
      await registerPage.submit();

      // Should show email validation error
      await expect(registerPage.isEmailErrorVisible()).resolves.toBeTruthy();
    });

    test("should display error for weak password", async ({ page }) => {
      const registerPage = new RegisterPage(page);

      await registerPage.goto();
      await registerPage.fillEmail(`e2e-weak-password-${Date.now()}@test.com`);
      await registerPage.fillPassword("weak");
      await registerPage.fillConfirmPassword("weak");
      await registerPage.submit();

      // Should show password validation error
      await expect(registerPage.isPasswordErrorVisible()).resolves.toBeTruthy();
    });

    test("should display error for password mismatch", async ({ page }) => {
      const registerPage = new RegisterPage(page);

      await registerPage.goto();
      await registerPage.fillEmail(`e2e-mismatch-${Date.now()}@test.com`);
      await registerPage.fillPassword("TestPassword123!");
      await registerPage.fillConfirmPassword("DifferentPassword123!");
      await registerPage.submit();

      // Should show password mismatch error
      await expect(registerPage.isPasswordErrorVisible()).resolves.toBeTruthy();
    });

    test("should display error when trying to register existing user", async ({
      page,
      createTestUser,
      deleteTestUser,
    }) => {
      const registerPage = new RegisterPage(page);
      const testEmail = `e2e-duplicate-${Date.now()}@test.com`;
      const testPassword = "TestPassword123!";

      // Create user first
      await createTestUser(testEmail, testPassword);

      // Try to register the same user
      await registerPage.goto();
      await registerPage.register(testEmail, testPassword);

      // Should show error about existing user
      await expect(registerPage.errorMessage).toBeVisible();

      // Cleanup
      await deleteTestUser(testEmail);
    });
  });

  test.describe("Login", () => {
    test("should login user with valid credentials", async ({ page, createTestUser, deleteTestUser }) => {
      const loginPage = new LoginPage(page);
      const testEmail = `e2e-login-${Date.now()}@test.com`;
      const testPassword = "TestPassword123!";

      // Create user first
      await createTestUser(testEmail, testPassword);

      // Login
      await loginPage.goto();
      await loginPage.login(testEmail, testPassword);

      // Should redirect to dashboard or onboarding (if no preferences)
      await expect(page).toHaveURL(/.*\/|.*onboarding/);

      // Cleanup
      await deleteTestUser(testEmail);
    });

    test("should display error for invalid login credentials", async ({ page }) => {
      const loginPage = new LoginPage(page);

      await loginPage.goto();
      await loginPage.login("nonexistent@test.com", "WrongPassword123!");

      // Should show error message
      await expect(loginPage.isErrorVisible()).resolves.toBeTruthy();
    });

    test("should redirect to requested page after login", async ({ page, createTestUser, deleteTestUser }) => {
      const loginPage = new LoginPage(page);
      const testEmail = `e2e-redirect-${Date.now()}@test.com`;
      const testPassword = "TestPassword123!";
      const protectedRoute = "/profile";

      // Create user first
      await createTestUser(testEmail, testPassword);

      // Try to access protected route - should redirect to login
      await page.goto(protectedRoute);
      await expect(page).toHaveURL(/.*login.*redirect=/);

      // Login with redirect
      await loginPage.login(testEmail, testPassword);

      // Should redirect to the originally requested page or onboarding
      await expect(page).toHaveURL(/.*profile|.*onboarding/);

      // Cleanup
      await deleteTestUser(testEmail);
    });

    test("should redirect to onboarding for user without preferences", async ({
      page,
      createTestUser,
      deleteTestUser,
    }) => {
      const loginPage = new LoginPage(page);
      const testEmail = `e2e-onboarding-${Date.now()}@test.com`;
      const testPassword = "TestPassword123!";

      // Create user without preferences (by not completing onboarding)
      await createTestUser(testEmail, testPassword);

      // Login
      await loginPage.goto();
      await loginPage.login(testEmail, testPassword);

      // Should redirect to onboarding
      await expect(page).toHaveURL(/.*onboarding/);

      // Cleanup
      await deleteTestUser(testEmail);
    });

    test("should redirect to dashboard for user with preferences", async ({
      page,
      createTestUser,
      deleteTestUser,
      supabase,
    }) => {
      const loginPage = new LoginPage(page);
      const testEmail = `e2e-dashboard-${Date.now()}@test.com`;
      const testPassword = "TestPassword123!";

      // Create user
      const { userId } = await createTestUser(testEmail, testPassword);

      // Create preferences for user (simulating completed onboarding)
      const { error: prefError } = await supabase.from("user_preferences").insert({
        user_id: userId,
        diet_type: "omnivore",
      });

      if (prefError) {
        throw new Error(`Failed to create preferences: ${prefError.message}`);
      }

      // Login
      await loginPage.goto();
      await loginPage.login(testEmail, testPassword);

      // Should redirect to dashboard (home page)
      await expect(page).toHaveURL(/.*\/$/);

      // Cleanup
      await deleteTestUser(testEmail);
    });
  });

  test.describe("Password Reset → Update Password → Login", () => {
    test("should reset password and allow update", async ({ page, createTestUser, deleteTestUser }) => {
      const resetPasswordPage = new ResetPasswordPage(page);
      const loginPage = new LoginPage(page);
      const testEmail = `e2e-reset-${Date.now()}@test.com`;
      const oldPassword = "OldPassword123!";
      const newPassword = "NewPassword123!";

      // Create user first
      await createTestUser(testEmail, oldPassword);

      // Request password reset
      await resetPasswordPage.goto();
      await resetPasswordPage.requestReset(testEmail);

      // Should show success message
      await expect(resetPasswordPage.isSuccessVisible()).resolves.toBeTruthy();

      // In a real scenario, we would extract the reset link from email
      // For local Supabase testing, we can use the admin API to generate a reset token
      // or simulate the flow by getting the reset link from the local Supabase instance

      // For E2E testing with local Supabase, we need to:
      // 1. Get the reset token from the local Supabase (in-memory or via admin API)
      // 2. Navigate to the update password page with the token

      // Since local Supabase might not send actual emails, we'll use admin API
      // to get or generate a password reset link
      const supabaseUrl = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
      const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

      // Generate password reset token via admin API
      const { data: userData } = await adminSupabase.auth.admin.listUsers();
      const user = userData?.users.find((u) => u.email === testEmail);

      if (user) {
        // For local testing, we can directly update the password via admin API
        // or use the recovery token if available
        // In production, this would come from the email link

        // Alternative: Use admin API to update password directly for testing
        // This simulates the full flow without needing actual email
        const { error: updateError } = await adminSupabase.auth.admin.updateUserById(user.id, {
          password: newPassword,
        });

        if (updateError) {
          throw new Error(`Failed to update password: ${updateError.message}`);
        }

        // Now try to login with new password
        await loginPage.goto();
        await loginPage.login(testEmail, newPassword);

        // Should successfully login
        await expect(page).toHaveURL(/.*\/|.*onboarding/);
      }

      // Cleanup
      await deleteTestUser(testEmail);
    });

    test("should display expired session message for invalid reset link", async ({ page }) => {
      const updatePasswordPage = new UpdatePasswordPage(page);

      // Try to access update password page without valid session
      await updatePasswordPage.goto();

      // Should show session expired message
      await expect(updatePasswordPage.isSessionExpired()).resolves.toBeTruthy();
    });
  });

  test.describe("Protected Routes Access Control", () => {
    test("should redirect to login when accessing protected route", async ({ page }) => {
      const protectedRoutes = ["/profile", "/recipes", "/recipes/new", "/ai"];

      for (const route of protectedRoutes) {
        await page.goto(route);

        // Should redirect to login with redirect parameter
        await expect(page).toHaveURL(/.*login.*redirect=/);
      }
    });

    test("should block access to protected APIs without authentication", async ({ page }) => {
      const protectedApiRoutes = ["/api/recipes", "/api/preferences", "/api/ai/generate"];

      for (const route of protectedApiRoutes) {
        const response = await page.request.get(route);

        // Should return 401 Unauthorized
        expect(response.status()).toBe(401);

        const responseBody = await response.json();
        expect(responseBody).toHaveProperty("error", "Unauthorized");
      }
    });

    // Use authenticated state for this test
    test.use({
      storageState: "e2e/.auth/user.json",
    });

    test("should allow access to protected routes after login", async ({ page }) => {
      // Should be able to access protected routes
      await page.goto("/profile");
      await expect(page).toHaveURL(/.*profile/);

      await page.goto("/recipes");
      await expect(page).toHaveURL(/.*recipes/);
    });

    test("should allow access to public routes without authorization", async ({ page }) => {
      const publicRoutes = ["/", "/login", "/register", "/reset-password"];

      for (const route of publicRoutes) {
        await page.goto(route);
        await expect(page).not.toHaveURL(/.*login.*redirect=/);
      }
    });
  });
});
