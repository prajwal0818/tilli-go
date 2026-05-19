import { test, expect } from '../fixtures/auth.fixture';
import { TaskGridPage } from '../page-objects/task-grid.page';
import { uniqueProjectCode, uniqueProjectName } from '../helpers/constants';

test.describe('Task Dependencies', () => {
  let grid: TaskGridPage;
  let projectId: string;

  test.beforeEach(async ({ authenticatedPage, apiHelper }) => {
    const code = uniqueProjectCode();
    const project = await apiHelper.createProject(uniqueProjectName(), code);
    projectId = project.id;

    await authenticatedPage.evaluate((pid) => {
      localStorage.setItem('selectedProjectId', pid);
    }, projectId);

    grid = new TaskGridPage(authenticatedPage);
  });

  test('dependency cell shows "None" by default', async ({ authenticatedPage, apiHelper }) => {
    await apiHelper.createTask(projectId, 'No Deps');
    await grid.goto();
    await grid.waitForGrid();

    const depText = await grid.getCellText(0, 'dependencies');
    expect(depText).toBe('None');
  });

  test('set dependency via API, verify in grid', async ({ authenticatedPage, apiHelper }) => {
    const taskA = await apiHelper.createTask(projectId, 'Task Alpha');
    const taskB = await apiHelper.createTask(projectId, 'Task Beta');

    await apiHelper.setTaskDependencies(taskB.id, [taskA.id]);

    await grid.goto();
    await grid.waitForGrid();

    // Task Beta (row 1) should show "Task Alpha" in the dependencies column
    const depText = await grid.getCellText(1, 'dependencies');
    expect(depText).toContain('Task Alpha');
  });

  test('dependency editor popup opens on click', async ({ authenticatedPage, apiHelper }) => {
    await apiHelper.createTask(projectId, 'Task 1');
    await apiHelper.createTask(projectId, 'Task 2');
    await grid.goto();
    await grid.waitForGrid();

    await grid.openDependencyEditor(0);
    const popup = grid.getDependencyPopup();
    await expect(popup).toBeVisible({ timeout: 3000 });
  });

  test('editor lists other tasks, not self', async ({ authenticatedPage, apiHelper }) => {
    await apiHelper.createTask(projectId, 'Self Task');
    await apiHelper.createTask(projectId, 'Other Task');
    await grid.goto();
    await grid.waitForGrid();

    // Open dependency editor for "Self Task" (row 0)
    await grid.openDependencyEditor(0);
    const popup = grid.getDependencyPopup();
    await expect(popup).toBeVisible({ timeout: 3000 });

    // Should list "Other Task" but NOT "Self Task"
    const labels = popup.locator('label');
    const count = await labels.count();
    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      texts.push((await labels.nth(i).textContent()) || '');
    }

    expect(texts.some((t) => t.includes('Other Task'))).toBe(true);
    expect(texts.some((t) => t.includes('Self Task'))).toBe(false);
  });

  test('select dependency via checkbox updates selected count', async ({ authenticatedPage, apiHelper }) => {
    await apiHelper.createTask(projectId, 'Dep Source');
    await apiHelper.createTask(projectId, 'Dep Target');
    await grid.goto();
    await grid.waitForGrid();

    // Open dep editor for Task B (row 1) and check "Dep Source"
    await grid.openDependencyEditor(1);
    const popup = grid.getDependencyPopup();
    await expect(popup).toBeVisible({ timeout: 3000 });

    // Verify initial count is 0
    const counter = grid.getDependencySelectedCount();
    await expect(counter).toContainText('0 selected');

    // Check the checkbox
    const checkbox = grid.getDependencyCheckbox('Dep Source');
    await checkbox.check();

    // Verify count updates to 1
    await expect(counter).toContainText('1 selected');
  });

  test('search filter works', async ({ authenticatedPage, apiHelper }) => {
    await apiHelper.createTask(projectId, 'Alpha Deploy');
    await apiHelper.createTask(projectId, 'Beta Rollback');
    await apiHelper.createTask(projectId, 'Gamma Deploy');
    await grid.goto();
    await grid.waitForGrid();

    // Open dep editor for first task (row 0)
    await grid.openDependencyEditor(0);
    const popup = grid.getDependencyPopup();
    await expect(popup).toBeVisible({ timeout: 3000 });

    // Search for "Beta"
    const searchInput = grid.getDependencySearchInput();
    await searchInput.fill('Beta');
    await grid.page.waitForTimeout(200);

    // Should only show "Beta Rollback"
    const labels = popup.locator('label');
    await expect(labels).toHaveCount(1);
    await expect(labels.first()).toContainText('Beta Rollback');
  });

  test('cycle detection rejected by API', async ({ authenticatedPage, apiHelper }) => {
    const taskA = await apiHelper.createTask(projectId, 'Cycle A');
    const taskB = await apiHelper.createTask(projectId, 'Cycle B');

    // A depends on B
    await apiHelper.setTaskDependencies(taskA.id, [taskB.id]);

    // B depends on A → should create a cycle
    const result = await apiHelper.updateTaskExpectError(taskB.id, {
      dependencies: [taskA.id],
    });

    expect(result.status).toBe(400);
    expect(JSON.stringify(result.body)).toContain('Circular dependency');
  });

  test('self-dependency rejected by API', async ({ authenticatedPage, apiHelper }) => {
    const task = await apiHelper.createTask(projectId, 'Self Dep');

    const result = await apiHelper.updateTaskExpectError(task.id, {
      dependencies: [task.id],
    });

    expect(result.status).toBe(400);
    expect(JSON.stringify(result.body)).toContain('cannot depend on itself');
  });

  test('multiple dependencies display correctly', async ({ authenticatedPage, apiHelper }) => {
    const taskA = await apiHelper.createTask(projectId, 'Dep One');
    const taskB = await apiHelper.createTask(projectId, 'Dep Two');
    const taskC = await apiHelper.createTask(projectId, 'Main Task');

    await apiHelper.setTaskDependencies(taskC.id, [taskA.id, taskB.id]);

    await grid.goto();
    await grid.waitForGrid();

    // taskC is row 2 (created last)
    const depText = await grid.getCellText(2, 'dependencies');
    expect(depText).toContain('Dep One');
    expect(depText).toContain('Dep Two');
  });
});
