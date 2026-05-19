import type { Page, Locator } from '@playwright/test';

export class LandingPage {
  readonly page: Page;
  readonly heroHeading: Locator;
  readonly getStartedButton: Locator;
  readonly signInLink: Locator;
  readonly goToDashboardButton: Locator;
  readonly deployFlowBrand: Locator;
  readonly featuresSection: Locator;
  readonly howItWorksSection: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heroHeading = page.locator('h1');
    this.getStartedButton = page.getByRole('link', { name: /get started/i });
    this.signInLink = page.getByRole('link', { name: /sign in/i }).first();
    this.goToDashboardButton = page.getByRole('link', { name: /go to dashboard/i }).first();
    this.deployFlowBrand = page.locator('nav').getByText(/DeployFlow|Tilli/i).first();
    this.featuresSection = page.getByText('Everything you need');
    this.howItWorksSection = page.getByText('How it works');
  }

  async goto() {
    await this.page.goto('/#/');
  }
}
