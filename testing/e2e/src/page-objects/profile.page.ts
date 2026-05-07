import type { Page, Locator } from '@playwright/test';

export class ProfilePage {
  readonly page: Page;
  readonly avatar: Locator;
  readonly userName: Locator;
  readonly userEmail: Locator;
  readonly infoCard: Locator;
  readonly comingSoonBadge: Locator;
  readonly noUserMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.avatar = page.locator('.rounded-full.bg-blue-600');
    this.userName = page.locator('h2.text-xl');
    this.userEmail = page.locator('h2.text-xl + p');
    this.infoCard = page.locator('.shadow.divide-y');
    this.comingSoonBadge = page.getByText('Coming Soon');
    this.noUserMessage = page.getByText('No user information available.');
  }

  async goto() {
    await this.page.goto('/#/profile');
  }

  getInfoRow(label: string): Locator {
    return this.infoCard.locator('div').filter({ hasText: label }).first();
  }
}
