import type { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for the Reset Password page
 */
export class ResetPasswordPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly submitButton: Locator;
  readonly loginLink: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.loginLink = page.locator('a[href="/login"]');
    this.errorMessage = page.locator('[class*="destructive"]');
    this.successMessage = page.locator('[class*="success"], [role="status"]');
  }

  async goto() {
    await this.page.goto("/reset-password");
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async submit() {
    await this.submitButton.click();
  }

  async requestReset(email: string) {
    await this.fillEmail(email);
    await this.submit();
  }

  async isSuccessVisible() {
    return await this.successMessage.isVisible();
  }

  async getSuccessMessage() {
    return await this.successMessage.textContent();
  }
}
