import type { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for the Update Password page
 */
export class UpdatePasswordPage {
  readonly page: Page;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly sessionExpiredMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.passwordInput = page.locator('input[type="password"]').first();
    this.confirmPasswordInput = page.locator('input[type="password"]').nth(1);
    this.submitButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('[class*="destructive"]');
    this.sessionExpiredMessage = page.locator("text=/.*wygasł.*/i");
  }

  async goto() {
    await this.page.goto("/auth/update-password");
  }

  async gotoWithCode(code: string) {
    await this.page.goto(`/auth/update-password?code=${code}`);
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

  async updatePassword(password: string, confirmPassword?: string) {
    await this.fillPassword(password);
    await this.fillConfirmPassword(confirmPassword || password);
    await this.submit();
  }

  async isSessionExpired() {
    return await this.sessionExpiredMessage.isVisible();
  }

  async isErrorVisible() {
    return await this.errorMessage.isVisible();
  }
}
