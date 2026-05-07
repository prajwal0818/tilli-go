import type { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly overviewHeading: Locator;
  readonly statusCards: Locator;
  readonly pieChart: Locator;
  readonly recentTasksHeading: Locator;
  readonly recentTasksTable: Locator;
  readonly noProjectMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.overviewHeading = page.getByText('Overview');
    this.statusCards = page.locator('button').filter({ has: page.locator('.text-3xl') });
    this.pieChart = page.locator('svg[viewBox="0 0 200 200"]');
    this.recentTasksHeading = page.getByText('Recent Tasks');
    this.recentTasksTable = page.locator('table');
    this.noProjectMessage = page.getByText('Select a project to view the dashboard.');
  }

  async goto() {
    await this.page.goto('/#/dashboard');
  }

  async getStatusCardCount(statusLabel: string): Promise<string> {
    const card = this.statusCards.filter({ hasText: statusLabel });
    return await card.locator('.text-3xl').textContent() || '0';
  }
}
