import type { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly overviewHeading: Locator;
  readonly statusCards: Locator;
  readonly pieChart: Locator;
  readonly recentTasksHeading: Locator;
  readonly recentTasksTable: Locator;
  readonly noProjectMessage: Locator;
  readonly emptyMessage: Locator;
  readonly pieChartTotal: Locator;
  readonly noTasksChartMessage: Locator;
  readonly loadingMessage: Locator;
  readonly errorMessage: Locator;
  readonly retryButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.overviewHeading = page.getByText('Overview');
    this.statusCards = page.locator('button').filter({ has: page.locator('.text-3xl') });
    this.pieChart = page.locator('svg[viewBox="0 0 200 200"]');
    this.recentTasksHeading = page.getByText('Recent Tasks');
    this.recentTasksTable = page.locator('table');
    this.noProjectMessage = page.getByText('Select a project to view the dashboard.');
    this.emptyMessage = page.getByText('No tasks yet. Go to Tasks to create one.');
    this.pieChartTotal = page.locator('svg[viewBox="0 0 200 200"] text').first();
    this.noTasksChartMessage = page.getByText('No tasks to display');
    this.loadingMessage = page.getByText('Loading dashboard...');
    this.errorMessage = page.locator('.text-destructive');
    this.retryButton = page.getByRole('button', { name: /retry/i });
  }

  async goto() {
    await this.page.goto('/#/dashboard');
    // Hash-only navigation doesn't reload the page, so React state
    // won't re-read localStorage. Force a full reload.
    await this.page.reload();
  }

  async getStatusCardCount(statusLabel: string): Promise<string> {
    const card = this.statusCards.filter({ hasText: statusLabel });
    return (await card.locator('.text-3xl').textContent()) || '0';
  }

  /** Locate a status card by its aria-label pattern. */
  getStatusCard(status: string): Locator {
    return this.page.locator(`button[aria-label*="${status} tasks"]`);
  }

  /** Parse the count from a status card's aria-label (e.g. "3 Pending tasks" → 3). */
  async getStatusCardCountByAria(status: string): Promise<number> {
    const card = this.getStatusCard(status);
    const label = (await card.getAttribute('aria-label')) || '0';
    const match = label.match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /** Get all rows in the recent tasks table body. */
  getRecentTaskRows(): Locator {
    return this.recentTasksTable.locator('tbody tr');
  }

  /** Get a specific cell in the recent tasks table by row and column index (0-based). */
  getRecentTaskCell(rowIndex: number, colIndex: number): Locator {
    return this.recentTasksTable.locator('tbody tr').nth(rowIndex).locator('td').nth(colIndex);
  }
}
