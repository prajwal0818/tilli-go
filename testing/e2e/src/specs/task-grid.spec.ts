import { test, expect } from '../fixtures/auth.fixture';
import { TaskGridPage } from '../page-objects/task-grid.page';
import { uniqueProjectCode, uniqueProjectName } from '../helpers/constants';

test.describe('Task Grid', () => {
  let grid: TaskGridPage;

  test('shows no-project message when no project selected', async ({ authenticatedPage }) => {
    await authenticatedPage.evaluate(() => {
      localStorage.removeItem('selectedProjectId');
    });

    grid = new TaskGridPage(authenticatedPage);
    await grid.goto();

    await expect(grid.noProjectMessage).toBeVisible();
  });

  test('shows Add Task button with project selected', async ({ authenticatedPage, apiHelper }) => {
    const code = uniqueProjectCode();
    const project = await apiHelper.createProject(uniqueProjectName(), code);

    await authenticatedPage.evaluate((pid) => {
      localStorage.setItem('selectedProjectId', pid);
    }, project.id);

    grid = new TaskGridPage(authenticatedPage);
    await grid.goto();

    await expect(grid.addTaskButton).toBeVisible({ timeout: 10_000 });
  });

  test('Add Task creates a new row', async ({ authenticatedPage, apiHelper }) => {
    const code = uniqueProjectCode();
    const project = await apiHelper.createProject(uniqueProjectName(), code);

    await authenticatedPage.evaluate((pid) => {
      localStorage.setItem('selectedProjectId', pid);
    }, project.id);

    grid = new TaskGridPage(authenticatedPage);
    await grid.goto();
    await expect(grid.addTaskButton).toBeVisible({ timeout: 10_000 });

    await grid.addTaskButton.click();

    // Wait for the new row to appear
    await authenticatedPage.waitForTimeout(600);
    const rows = grid.getRows();
    await expect(rows).toHaveCount(1, { timeout: 5_000 });
  });

  test('task count updates after adding tasks', async ({ authenticatedPage, apiHelper }) => {
    const code = uniqueProjectCode();
    const project = await apiHelper.createProject(uniqueProjectName(), code);

    await authenticatedPage.evaluate((pid) => {
      localStorage.setItem('selectedProjectId', pid);
    }, project.id);

    grid = new TaskGridPage(authenticatedPage);
    await grid.goto();
    await expect(grid.addTaskButton).toBeVisible({ timeout: 10_000 });

    // Initially 0 tasks
    await expect(grid.taskCount).toContainText('0 task');

    await grid.addTaskButton.click();
    await authenticatedPage.waitForTimeout(600);

    await expect(grid.taskCount).toContainText('1 task');
  });

  test('delete selected tasks', async ({ authenticatedPage, apiHelper }) => {
    const code = uniqueProjectCode();
    const project = await apiHelper.createProject(uniqueProjectName(), code);
    // Create a task via API
    await apiHelper.createTask(project.id, 'Task to Delete');

    await authenticatedPage.evaluate((pid) => {
      localStorage.setItem('selectedProjectId', pid);
    }, project.id);

    grid = new TaskGridPage(authenticatedPage);
    await grid.goto();
    await grid.waitForGrid();

    // Select the row by clicking its checkbox
    const checkbox = grid.getRowCheckbox(0);
    await checkbox.click();

    // Accept the confirmation dialog
    authenticatedPage.on('dialog', (dialog) => dialog.accept());

    await grid.deleteSelectedButton.click();
    await authenticatedPage.waitForTimeout(600);

    // Row should be gone
    await expect(grid.taskCount).toContainText('0 task');
  });
});
