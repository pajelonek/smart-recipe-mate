import type { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for the Login page
 */
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly registerLink: Locator;
  readonly resetPasswordLink: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.registerLink = page.locator('a[href="/register"]');
    this.resetPasswordLink = page.locator('a[href="/reset-password"]');
    this.errorMessage = page.locator('[class*="destructive"]');
    this.successMessage = page.locator('[class*="success"], [role="status"]');
  }

  async goto(redirect?: string) {
    const url = redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login";
    await this.page.goto(url);
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  async submit() {
    await this.submitButton.click();
  }

  async login(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
  }

  async isErrorVisible() {
    return await this.errorMessage.isVisible();
  }

  async getErrorMessage() {
    return await this.errorMessage.textContent();
  }
}
