import type { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for the Registration page
 */
export class RegisterPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;
  readonly loginLink: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]').first();
    this.confirmPasswordInput = page.locator('input[type="password"]').nth(1);
    this.submitButton = page.locator('button[type="submit"]');
    this.loginLink = page.locator('a[href="/login"]');
    this.errorMessage = page.locator('[class*="destructive"]');
    this.successMessage = page.locator('[class*="success"], [role="status"]');
  }

  async goto() {
    await this.page.goto("/register");
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  async fillConfirmPassword(password: string) {
    await this.confirmPasswordInput.fill(password);
  }

  async submit() {
    await this.submitButton.click();
  }

  async register(email: string, password: string, confirmPassword?: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.fillConfirmPassword(confirmPassword || password);
    await this.submit();
  }

  async isEmailErrorVisible() {
    return await this.page.locator("text=/.*email.*/i").isVisible();
  }

  async isPasswordErrorVisible() {
    return await this.page.locator("text=/.*hasło.*/i").isVisible();
  }
}
