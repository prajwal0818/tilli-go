import { test, expect } from '../fixtures/auth.fixture';
import { ProjectsPage } from '../page-objects/projects.page';
import { HeaderComponent } from '../page-objects/header.component';
import { uniqueProjectCode, uniqueProjectName } from '../helpers/constants';

test.describe('Projects', () => {
  let projects: ProjectsPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    projects = new ProjectsPage(authenticatedPage);
    await projects.goto();
    // Wait for page to load
    await expect(projects.heading).toBeVisible();
  });

  test('displays projects page heading', async () => {
    await expect(projects.heading).toBeVisible();
  });

  test('shows New Project button', async () => {
    await expect(projects.newProjectButton).toBeVisible();
  });

  test('creates a new project', async ({ authenticatedPage }) => {
    const code = uniqueProjectCode();
    const name = uniqueProjectName();

    await projects.createProject(name, code, 'Test description');

    // Wait for creation — the form should close
    await expect(projects.createButton).not.toBeVisible({ timeout: 10_000 });

    // Project should appear in the list
    const projectRow = projects.getProjectRow(code);
    await expect(projectRow).toBeVisible();
  });

  test('new project is auto-selected as active', async ({ authenticatedPage }) => {
    const code = uniqueProjectCode();
    const name = uniqueProjectName();

    await projects.createProject(name, code);
    await expect(projects.createButton).not.toBeVisible({ timeout: 10_000 });

    // Should show Active indicator
    const activeIndicator = projects.getActiveIndicator(code);
    await expect(activeIndicator).toBeVisible();
  });

  test('code input auto-uppercases', async ({ authenticatedPage }) => {
    await projects.newProjectButton.click();
    await projects.codeInput.fill('lowercase');

    const value = await projects.codeInput.inputValue();
    expect(value).toBe('LOWERCASE');
  });

  test('header dropdown reflects selected project', async ({ authenticatedPage }) => {
    const header = new HeaderComponent(authenticatedPage);
    const code = uniqueProjectCode();
    const name = uniqueProjectName();

    await projects.createProject(name, code);
    await expect(projects.createButton).not.toBeVisible({ timeout: 10_000 });

    // The header dropdown should contain the project
    const selectedText = await header.getSelectedProjectText();
    expect(selectedText).toContain(code);
  });

  test('delete project with confirmation', async ({ authenticatedPage, apiHelper }) => {
    // Create a project via API for clean isolation
    const code = uniqueProjectCode();
    const project = await apiHelper.createProject('Delete Me', code);

    await projects.goto();
    await expect(projects.heading).toBeVisible();

    // Set up dialog handler to accept confirmation
    authenticatedPage.on('dialog', (dialog) => dialog.accept());

    const deleteButton = projects.getDeleteButton(code);
    await deleteButton.click();

    // Wait for the project to be removed from the list
    await expect(projects.getProjectRow(code)).not.toBeVisible({ timeout: 10_000 });
  });
});
