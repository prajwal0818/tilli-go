import type { Page, Locator } from '@playwright/test';

export class CompletePage {
  readonly page: Page;
  readonly title: Locator;
  readonly errorIcon: Locator;
  readonly errorHeading: Locator;
  readonly errorText: Locator;
  readonly successIcon: Locator;
  readonly successHeading: Locator;
  readonly loadingMessage: Locator;
  readonly statusBadge: Locator;
  readonly completedAtCell: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator('h1');
    this.errorHeading = page.getByText('Completion Failed');
    this.errorText = page.locator('p').filter({ hasText: /missing|invalid|token|expired/i });
    this.errorIcon = page.locator('div').filter({ hasText: '\u2717' }).first();
    this.successIcon = page.locator('div').filter({ hasText: '\u2713' }).first();
    this.successHeading = page.getByText(/completed/i);
    this.loadingMessage = page.getByText('Completing task...');
    this.statusBadge = page.locator('span').filter({ hasText: 'Completed' });
    this.completedAtCell = page.getByText('Completed At').locator('..').locator('~ td');
  }

  async gotoWithParams(taskId?: string, token?: string) {
    const params = new URLSearchParams();
    if (taskId) params.set('task_id', taskId);
    if (token) params.set('token', token);
    await this.page.goto(`/#/complete?${params.toString()}`);
  }

  async gotoWithoutParams() {
    await this.page.goto('/#/complete');
  }
}
