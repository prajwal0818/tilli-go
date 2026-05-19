import type { Page, Locator } from '@playwright/test';

export class ProjectsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly newProjectButton: Locator;
  readonly projectNameInput: Locator;
  readonly codeInput: Locator;
  readonly descriptionInput: Locator;
  readonly createButton: Locator;
  readonly cancelButton: Locator;
  readonly projectList: Locator;
  readonly errorMessage: Locator;
  readonly emptyMessage: Locator;
  readonly selectAllCheckbox: Locator;
  readonly deleteSelectedButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Projects', level: 2 });
    this.newProjectButton = page.getByRole('button', { name: /new project/i });
    this.projectNameInput = page.getByLabel('Project Name');
    this.codeInput = page.getByLabel('Code');
    this.descriptionInput = page.getByLabel('Description');
    this.createButton = page.getByRole('button', { name: /create project/i });
    this.cancelButton = page.getByRole('button', { name: /cancel/i });
    this.projectList = page.locator('.divide-y');
    this.errorMessage = page.locator('.text-destructive');
    this.emptyMessage = page.getByText('No projects yet');
    this.selectAllCheckbox = page.getByLabel('Select all projects');
    this.deleteSelectedButton = page.getByRole('button', { name: /delete \(\d+\)/i });
  }

  async goto() {
    await this.page.goto('/#/projects');
    await this.page.reload();
  }

  async createProject(name: string, code: string, description?: string) {
    await this.newProjectButton.click();
    await this.projectNameInput.fill(name);
    await this.codeInput.fill(code);
    if (description) {
      await this.descriptionInput.fill(description);
    }
    await this.createButton.click();
  }

  getProjectRow(code: string): Locator {
    return this.projectList.locator('div').filter({ hasText: code }).first();
  }

  getProjectCheckbox(code: string): Locator {
    return this.getProjectRow(code).getByRole('checkbox');
  }

  getDeleteButton(code: string): Locator {
    return this.getProjectRow(code).getByRole('button', { name: /delete/i });
  }

  getActiveIndicator(code: string): Locator {
    return this.getProjectRow(code).getByText('Active');
  }
}
