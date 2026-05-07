import type { Page, Locator } from '@playwright/test';

export class HeaderComponent {
  readonly page: Page;
  readonly header: Locator;
  readonly pageTitle: Locator;
  readonly projectDropdown: Locator;
  readonly userEmail: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.locator('header');
    this.pageTitle = page.locator('header h1');
    this.projectDropdown = page.getByLabel('Select project');
    this.userEmail = this.header.locator('a[href*="profile"]');
  }

  async selectProject(projectCodeOrName: string) {
    await this.projectDropdown.selectOption({ label: new RegExp(projectCodeOrName) });
  }

  async getSelectedProjectText(): Promise<string> {
    return await this.projectDropdown.locator('option:checked').textContent() || '';
  }

  async getPageTitleText(): Promise<string> {
    return await this.pageTitle.textContent() || '';
  }
}
