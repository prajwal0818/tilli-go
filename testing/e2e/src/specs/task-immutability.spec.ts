import { test, expect } from '../fixtures/auth.fixture';
import { TaskGridPage } from '../page-objects/task-grid.page';
import { uniqueProjectCode, uniqueProjectName, createTaskAtStatus } from '../helpers/constants';

test.describe('Task Immutability — Completed Tasks', () => {
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

  test('Completed task cannot change status via API', async ({ apiHelper }) => {
    const task = await createTaskAtStatus(apiHelper, projectId, 'Locked', 'Completed');

    for (const status of ['Pending', 'Triggered', 'Acknowledged', 'Blocked']) {
      const result = await apiHelper.updateTaskExpectError(task.id, { status });
      expect(result.status).toBe(400);
    }
  });

  test('Completed task cannot change taskName via API', async ({ apiHelper }) => {
    const task = await createTaskAtStatus(apiHelper, projectId, 'No Rename', 'Completed');
    const result = await apiHelper.updateTaskExpectError(task.id, { taskName: 'New Name' });
    expect(result.status).toBe(400);
    expect(JSON.stringify(result.body)).toContain('Cannot modify a completed task');
  });

  test('Completed task cannot change dependencies via API', async ({ apiHelper }) => {
    const other = await apiHelper.createTask(projectId, 'Other Task');
    const task = await createTaskAtStatus(apiHelper, projectId, 'No Deps Change', 'Completed');

    const result = await apiHelper.updateTaskExpectError(task.id, {
      dependencies: [other.id],
    });
    expect(result.status).toBe(400);
  });

  test('Completed task description is not editable in grid', async ({ authenticatedPage, apiHelper }) => {
    await createTaskAtStatus(apiHelper, projectId, 'Grid Immutable', 'Completed');
    await grid.goto();
    await grid.waitForGrid();

    const editableDesc = await grid.isCellEditable(0, 'description');
    expect(editableDesc).toBe(false);
  });

  test('Completed task row has lock icon and no status dropdown', async ({ authenticatedPage, apiHelper }) => {
    await createTaskAtStatus(apiHelper, projectId, 'Lock Check', 'Completed');
    await grid.goto();
    await grid.waitForGrid();

    const statusCell = grid.getCell(0, 'status');
    // Lock icon = SVG with rect
    const lockIcon = statusCell.locator('svg rect');
    await expect(lockIcon).toBeVisible();

    // Should NOT have the editable chevron
    const chevron = statusCell.locator('.status-edit-icon');
    await expect(chevron).not.toBeAttached();
  });
});
