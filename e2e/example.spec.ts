import { test, expect } from "@playwright/test";

/**
 * Example E2E test
 * This is a placeholder test file demonstrating the structure
 * You can delete this file once you start writing real tests
 */
test.describe("Example Test Suite", () => {
  test("should load the home page", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Smart Recipe Mate/i);
  });
});
