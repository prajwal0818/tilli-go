import type { Page, Locator } from '@playwright/test';

export class TaskGridPage {
  readonly page: Page;
  readonly addTaskButton: Locator;
  readonly deleteSelectedButton: Locator;
  readonly taskCount: Locator;
  readonly grid: Locator;
  readonly noProjectMessage: Locator;
  readonly loadingMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addTaskButton = page.getByRole('button', { name: /add task/i });
    this.deleteSelectedButton = page.getByRole('button', { name: /delete selected/i });
    this.taskCount = page.locator('.text-gray-400').filter({ hasText: /task/ });
    this.grid = page.locator('.ag-theme-alpine');
    this.noProjectMessage = page.getByText('Select a project to view tasks.');
    this.loadingMessage = page.getByText('Loading tasks...');
  }

  async goto() {
    await this.page.goto('/#/tasks');
  }

  /** Get a specific cell in the grid by row index and column ID. */
  getCell(rowIndex: number, colId: string): Locator {
    return this.page.locator(`.ag-row[row-index="${rowIndex}"] .ag-cell[col-id="${colId}"]`);
  }

  /** Get the checkbox for row selection. */
  getRowCheckbox(rowIndex: number): Locator {
    return this.page.locator(`.ag-row[row-index="${rowIndex}"] .ag-selection-checkbox`);
  }

  /** Get all visible rows. */
  getRows(): Locator {
    return this.page.locator('.ag-row');
  }

  /** Wait for grid to be fully loaded (rows rendered). */
  async waitForGrid() {
    await this.grid.waitFor({ state: 'visible' });
    // Small wait for AG Grid to finish rendering
    await this.page.waitForTimeout(500);
  }
}
