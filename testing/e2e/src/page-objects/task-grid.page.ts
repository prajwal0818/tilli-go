import type { Page, Locator } from '@playwright/test';

export class TaskGridPage {
  readonly page: Page;
  readonly addTaskButton: Locator;
  readonly deleteSelectedButton: Locator;
  readonly taskCount: Locator;
  readonly grid: Locator;
  readonly noProjectMessage: Locator;
  readonly loadingMessage: Locator;
  readonly errorMessage: Locator;
  readonly retryButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addTaskButton = page.getByRole('button', { name: /add task/i });
    this.deleteSelectedButton = page.getByRole('button', { name: /delete selected/i });
    this.taskCount = page.locator('.text-gray-400, .text-text-muted').filter({ hasText: /task/ });
    this.grid = page.locator('.ag-theme-alpine');
    this.noProjectMessage = page.getByText('Select a project to view tasks.');
    this.loadingMessage = page.getByText('Loading tasks...');
    this.errorMessage = page.locator('.text-destructive');
    this.retryButton = page.getByRole('button', { name: /retry/i });
  }

  async goto() {
    await this.page.goto('/#/tasks');
    // Hash-only navigation doesn't reload the page, so React state
    // won't re-read localStorage. Force a full reload to pick up
    // any localStorage changes (e.g. selectedProjectId, token).
    await this.page.reload();
  }

  /** Scroll the grid horizontally so that a column is visible and its cells are rendered. */
  async scrollToColumn(colId: string): Promise<void> {
    const viewport = this.page.locator('.ag-center-cols-viewport');
    for (let i = 0; i < 15; i++) {
      const cell = this.page.locator(`.ag-center-cols-container .ag-row .ag-cell[col-id="${colId}"]`);
      if ((await cell.count()) > 0) break;
      await viewport.evaluate((el) => { el.scrollLeft += 200; });
      await this.page.waitForTimeout(100);
    }
  }

  /** Get a specific cell in the grid by row index and column ID. */
  getCell(rowIndex: number, colId: string): Locator {
    // With pinned columns, each row appears in both pinned and center containers.
    // A cell with a given col-id only exists in one container, so this resolves to 1 element.
    return this.page.locator(`.ag-row[row-index="${rowIndex}"] .ag-cell[col-id="${colId}"]`);
  }

  /** Get the checkbox for row selection. */
  getRowCheckbox(rowIndex: number): Locator {
    return this.page.locator(`.ag-row[row-index="${rowIndex}"] .ag-selection-checkbox`).first();
  }

  /** Get all visible rows in the center column container (avoids double-counting from pinned columns). */
  getRows(): Locator {
    return this.page.locator('.ag-center-cols-container .ag-row');
  }

  /** Get a specific row by index (uses .first() to avoid pinned column duplicates). */
  getRow(rowIndex: number): Locator {
    return this.page.locator(`.ag-row[row-index="${rowIndex}"]`).first();
  }

  /** Wait for grid to be fully loaded (rows rendered). */
  async waitForGrid() {
    await this.grid.waitFor({ state: 'visible' });
    // Small wait for AG Grid to finish rendering
    await this.page.waitForTimeout(500);
  }

  /** Read the text content of a cell (scrolls to column if needed). */
  async getCellText(rowIndex: number, colId: string): Promise<string> {
    await this.scrollToColumn(colId);
    const cell = this.getCell(rowIndex, colId);
    return (await cell.textContent()) || '';
  }

  /** Edit a text cell: scroll to column → click → fill input → Tab out → wait for debounce. */
  async editTextCell(rowIndex: number, colId: string, value: string): Promise<void> {
    await this.scrollToColumn(colId);
    const cell = this.getCell(rowIndex, colId);
    await cell.click();
    // Wait for AG Grid editor to appear
    const input = cell.locator('input, textarea').first();
    await input.waitFor({ state: 'visible', timeout: 3000 });
    await input.fill(value);
    await this.page.keyboard.press('Tab');
    // Wait for 400ms debounce + buffer
    await this.page.waitForTimeout(600);
  }

  /**
   * Edit a select cell (AG Grid 32 custom combobox).
   * Click cell → click the picker to open dropdown → click the option.
   */
  async editSelectCell(rowIndex: number, colId: string, value: string): Promise<void> {
    await this.scrollToColumn(colId);
    const cell = this.getCell(rowIndex, colId);
    await cell.click();
    // AG Grid 32 uses a custom combobox, not native <select>.
    // Wait for the picker field to appear, then click to open dropdown.
    await this.page.waitForTimeout(200);
    const picker = cell.locator('.ag-picker-field-wrapper').first();
    if (await picker.isVisible()) {
      await picker.click();
    }
    // Select from the popup list
    const option = this.page.locator('.ag-select-list-item').filter({ hasText: new RegExp(`^${value}$`) });
    await option.waitFor({ state: 'visible', timeout: 3000 });
    await option.click();
    await this.page.waitForTimeout(600);
  }

  /**
   * Edit a datetime-local cell.
   * The DateTimeEditor auto-opens the native picker via showPicker().
   * We stub showPicker, then use the native value setter + React event
   * dispatch pattern to set the value on the controlled input, and Tab to commit.
   */
  async editDateTimeCell(rowIndex: number, colId: string, isoDate: string): Promise<void> {
    await this.scrollToColumn(colId);
    // Prevent the native date picker from auto-opening
    await this.page.evaluate(() => {
      HTMLInputElement.prototype.showPicker = function () {};
    });
    const cell = this.getCell(rowIndex, colId);
    await cell.click();
    const input = cell.locator('input[type="datetime-local"]').first();
    await input.waitFor({ state: 'visible', timeout: 3000 });
    // Use native value setter to bypass React's controlled input mechanism,
    // then dispatch an 'input' event so React's onChange fires and updates state.
    await input.evaluate((el, val) => {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
      )?.set;
      if (nativeSetter) nativeSetter.call(el, val);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, isoDate);
    await this.page.waitForTimeout(100);
    await this.page.keyboard.press('Tab');
    await this.page.waitForTimeout(600);
  }

  /** Open the dependency editor by clicking the dependencies cell. */
  async openDependencyEditor(rowIndex: number): Promise<void> {
    await this.scrollToColumn('dependencies');
    const cell = this.getCell(rowIndex, 'dependencies');
    await cell.click();
    // Wait for the editor's search input to appear
    await this.page.getByPlaceholder('Search tasks...').waitFor({ state: 'visible', timeout: 3000 });
  }

  /**
   * Get the dependency editor container.
   * AG Grid 32 renders the DependencyEditor inline inside the cell rather than
   * in a separate `.ag-popup-editor` overlay. Locate it by navigating from the
   * unique "Search tasks..." input up to its parent container div.
   */
  getDependencyPopup(): Locator {
    return this.page.getByPlaceholder('Search tasks...').locator('..');
  }

  /** Get the search input inside the dependency editor. */
  getDependencySearchInput(): Locator {
    return this.page.getByPlaceholder('Search tasks...');
  }

  /** Get a specific checkbox by task name inside the dependency editor. */
  getDependencyCheckbox(taskName: string): Locator {
    return this.getDependencyPopup().locator('label').filter({ hasText: taskName }).locator('input[type="checkbox"]');
  }

  /** Get the "N selected" count text from the dependency editor. */
  getDependencySelectedCount(): Locator {
    return this.getDependencyPopup().locator('div').filter({ hasText: /selected/ }).last();
  }

  /** Check if a row has a specific CSS class (e.g. row-status-pending). */
  async rowHasClass(rowIndex: number, className: string): Promise<boolean> {
    const row = this.getRow(rowIndex);
    const classes = await row.getAttribute('class');
    return classes ? classes.includes(className) : false;
  }

  /**
   * Check if a cell is editable by clicking it and seeing if an editor appears.
   * Also checks for AG Grid's custom editors (combobox, input, textarea, select).
   */
  async isCellEditable(rowIndex: number, colId: string): Promise<boolean> {
    await this.scrollToColumn(colId);
    const cell = this.getCell(rowIndex, colId);
    await cell.click();
    // Brief wait for editor
    await this.page.waitForTimeout(300);
    const editor = cell.locator('input, textarea, select, [role="combobox"]');
    const count = await editor.count();
    if (count > 0) {
      await this.page.keyboard.press('Escape');
      return true;
    }
    return false;
  }
}
