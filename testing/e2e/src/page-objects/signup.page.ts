import type { Page, Locator } from '@playwright/test';

export class SignUpPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly signUpButton: Locator;
  readonly signInLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: /create account/i });
    this.nameInput = page.getByLabel('Name');
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password', { exact: true });
    this.confirmPasswordInput = page.getByLabel('Confirm Password');
    this.signUpButton = page.getByRole('button', { name: /sign up/i });
    this.signInLink = page.getByRole('link', { name: /sign in/i });
    this.errorMessage = page.locator('.text-destructive');
  }

  async goto() {
    await this.page.goto('/#/signup');
  }

  async signUp(name: string, email: string, password: string, confirmPassword?: string) {
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(confirmPassword ?? password);
    await this.signUpButton.click();
  }
}
