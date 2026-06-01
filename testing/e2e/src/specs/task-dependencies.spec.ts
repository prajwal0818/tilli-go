import { test, expect } from '../fixtures/auth.fixture';
import { TaskGridPage } from '../page-objects/task-grid.page';
import { uniqueProjectCode, uniqueProjectName } from '../helpers/constants';

test.describe('Task Dependencies', () => {
  let grid: TaskGridPage;
  let projectId: string;
  let projectCode: string;

  test.beforeEach(async ({ authenticatedPage, apiHelper }) => {
    projectCode = uniqueProjectCode();
    const project = await apiHelper.createProject(uniqueProjectName(), projectCode);
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

    // Task Beta (row 1) should show Task Alpha's display ID in the dependencies column
    const depText = await grid.getCellText(1, 'dependencies');
    const expectedDisplayId = `${projectCode}-${taskA.sequenceNumber}`;
    expect(depText).toContain(expectedDisplayId);
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

    // Editor uses div[role="option"] elements for available tasks
    const options = grid.getDependencyOptions();
    const count = await options.count();
    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      texts.push((await options.nth(i).textContent()) || '');
    }

    // Should list "Other Task" but NOT "Self Task"
    expect(texts.some((t) => t.includes('Other Task'))).toBe(true);
    expect(texts.some((t) => t.includes('Self Task'))).toBe(false);
  });

  test('select dependency via click updates selected section', async ({ authenticatedPage, apiHelper }) => {
    await apiHelper.createTask(projectId, 'Dep Source');
    await apiHelper.createTask(projectId, 'Dep Target');
    await grid.goto();
    await grid.waitForGrid();

    // Open dep editor for Task B (row 1) and click "Dep Source"
    await grid.openDependencyEditor(1);
    const popup = grid.getDependencyPopup();
    await expect(popup).toBeVisible({ timeout: 3000 });

    // Initially, no "Selected" header should be visible (0 selected)
    const selectedHeader = grid.getDependencySelectedHeader();
    await expect(selectedHeader).not.toBeVisible();

    // Click the option to add it
    const option = grid.getDependencyOption('Dep Source');
    await option.click();

    // "Selected (1)" header should now appear
    await expect(selectedHeader).toContainText('Selected (1)');
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

    // Should only show "Beta Rollback" in the available options
    const options = grid.getDependencyOptions();
    await expect(options).toHaveCount(1);
    await expect(options.first()).toContainText('Beta Rollback');
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

    // taskC is row 2 (created last) — dependencies show display IDs
    const depText = await grid.getCellText(2, 'dependencies');
    expect(depText).toContain(`${projectCode}-${taskA.sequenceNumber}`);
    expect(depText).toContain(`${projectCode}-${taskB.sequenceNumber}`);
  });
});
