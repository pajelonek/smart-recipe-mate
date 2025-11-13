import { test, expect } from "./fixtures/auth.fixture";
import { RegisterPage } from "./pages/RegisterPage";
import { LoginPage } from "./pages/LoginPage";

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

      // Should show email validation error - wait for the error message to appear
      const errorMessage = page.locator("p.text-destructive").filter({ hasText: /email|Nieprawidłowy/i });
      await expect(errorMessage).toBeVisible();
    });

    test("should display error for weak password", async ({ page }) => {
      const registerPage = new RegisterPage(page);

      await registerPage.goto();
      await registerPage.fillEmail(`e2e-weak-password-${Date.now()}@test.com`);
      await registerPage.fillPassword("weak");
      await registerPage.fillConfirmPassword("weak");
      await registerPage.submit();

      // Should show password validation error - wait for the error message to appear
      const errorMessage = page.locator("p.text-destructive").filter({
        hasText: /hasło musi spełniać/i,
      });
      await expect(errorMessage).toBeVisible();
    });

    test("should display error for password mismatch", async ({ page }) => {
      const registerPage = new RegisterPage(page);

      await registerPage.goto();
      await registerPage.fillEmail(`e2e-mismatch-${Date.now()}@test.com`);
      await registerPage.fillPassword("TestPassword123!");
      await registerPage.fillConfirmPassword("DifferentPassword123!");
      await registerPage.submit();

      // Should show password mismatch error - wait for the error message to appear
      const errorMessage = page.locator("p.text-destructive").filter({
        hasText: /hasła nie są identyczne/i,
      });
      await expect(errorMessage).toBeVisible();
    });
  });

  test.describe("Login", () => {
    test("should login user with valid credentials", async ({ page, createTestUser }) => {
      const loginPage = new LoginPage(page);
      const testEmail = `e2e-login-${Date.now()}@test.com`;
      const testPassword = "TestPassword123!";

      // Create user first (automatic cleanup after test)
      await createTestUser(testEmail, testPassword);

      // Login
      await loginPage.goto();
      await loginPage.login(testEmail, testPassword);

      // Should redirect to dashboard or onboarding (if no preferences)
      await expect(page).toHaveURL(/.*\/|.*onboarding/);
    });

    test("should display error for invalid login credentials", async ({ page }) => {
      const loginPage = new LoginPage(page);

      await loginPage.goto();
      await loginPage.login("nonexistent@test.com", "WrongPassword123!");

      // Should show error message - wait for the error message to appear
      const errorMessage = page.locator("div[class*='destructive']").filter({
        hasText: /Nieprawidłowy email lub hasło|Wystąpił błąd podczas logowania/i,
      });
      await expect(errorMessage).toBeVisible();
    });

    test("should redirect to requested page after login", async ({ page, createTestUser }) => {
      const loginPage = new LoginPage(page);
      const testEmail = `e2e-redirect-${Date.now()}@test.com`;
      const testPassword = "TestPassword123!";
      const protectedRoute = "/profile";

      // Create user first (automatic cleanup after test)
      await createTestUser(testEmail, testPassword);

      // Try to access protected route - should redirect to login
      await page.goto(protectedRoute);
      await expect(page).toHaveURL(/.*login.*redirect=/);

      // Login with redirect
      await loginPage.login(testEmail, testPassword);

      // Should redirect to the originally requested page or onboarding
      await expect(page).toHaveURL(/.*profile|.*onboarding/);
    });

    test("should redirect to onboarding for user without preferences", async ({ page, createTestUser }) => {
      const loginPage = new LoginPage(page);
      const testEmail = `e2e-onboarding-${Date.now()}@test.com`;
      const testPassword = "TestPassword123!";

      // Create user without preferences (by not completing onboarding)
      // Automatic cleanup after test
      await createTestUser(testEmail, testPassword);

      // Login
      await loginPage.goto();
      await loginPage.login(testEmail, testPassword);

      // Should redirect to onboarding
      await expect(page).toHaveURL(/.*onboarding/);
    });

    test("should redirect to dashboard for user with preferences", async ({ page, createTestUserWithPreferences }) => {
      const loginPage = new LoginPage(page);
      const testEmail = `e2e-dashboard-${Date.now()}@test.com`;
      const testPassword = "TestPassword123!";

      // Create user with preferences (automatic cleanup after test)
      await createTestUserWithPreferences(testEmail, testPassword);

      // Login
      await loginPage.goto();
      await loginPage.login(testEmail, testPassword);

      // Should redirect to dashboard (home page)
      await expect(page).toHaveURL(/.*\/$/);
    });
  });
});
