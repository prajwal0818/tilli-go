import type { Page, Locator } from '@playwright/test';

export class ToastComponent {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /** Get all currently visible toast elements. */
  getToasts(): Locator {
    return this.page.locator('[role="alert"]');
  }

  /** Get the last (most recent) toast. */
  getLatestToast(): Locator {
    return this.getToasts().last();
  }

  /** Wait for a toast containing the specified text to appear. */
  async waitForToast(text: string | RegExp, timeout = 5000): Promise<Locator> {
    const locator = typeof text === 'string'
      ? this.page.locator('[role="alert"]').filter({ hasText: text })
      : this.page.locator('[role="alert"]').filter({ hasText: text });
    await locator.first().waitFor({ state: 'visible', timeout });
    return locator.first();
  }

  /** Wait for all toasts to disappear from the DOM. */
  async waitForNoToasts(timeout = 10000): Promise<void> {
    await this.getToasts().first().waitFor({ state: 'hidden', timeout }).catch(() => {
      // If no toasts exist at all, that's fine
    });
  }
}
