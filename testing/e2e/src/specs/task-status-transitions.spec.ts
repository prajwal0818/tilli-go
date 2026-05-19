import { test, expect } from '../fixtures/auth.fixture';
import { TaskGridPage } from '../page-objects/task-grid.page';
import { uniqueProjectCode, uniqueProjectName, createTaskAtStatus } from '../helpers/constants';

test.describe('Task Status Transitions', () => {
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

  test('new task has Pending status', async ({ authenticatedPage, apiHelper }) => {
    await apiHelper.createTask(projectId, 'Pending Check');
    await grid.goto();
    await grid.waitForGrid();

    const statusText = await grid.getCellText(0, 'status');
    expect(statusText).toContain('Pending');
  });

  test('Pending row has row-status-pending class', async ({ authenticatedPage, apiHelper }) => {
    await apiHelper.createTask(projectId, 'Pending Class');
    await grid.goto();
    await grid.waitForGrid();

    expect(await grid.rowHasClass(0, 'row-status-pending')).toBe(true);
  });

  test('Triggered row has correct class', async ({ authenticatedPage, apiHelper }) => {
    await createTaskAtStatus(apiHelper, projectId, 'Triggered Class', 'Triggered');
    await grid.goto();
    await grid.waitForGrid();

    expect(await grid.rowHasClass(0, 'row-status-triggered')).toBe(true);
  });

  test('Acknowledged row has correct class', async ({ authenticatedPage, apiHelper }) => {
    await createTaskAtStatus(apiHelper, projectId, 'Ack Class', 'Acknowledged');
    await grid.goto();
    await grid.waitForGrid();

    expect(await grid.rowHasClass(0, 'row-status-acknowledged')).toBe(true);
  });

  test('Completed row has correct class', async ({ authenticatedPage, apiHelper }) => {
    await createTaskAtStatus(apiHelper, projectId, 'Completed Class', 'Completed');
    await grid.goto();
    await grid.waitForGrid();

    expect(await grid.rowHasClass(0, 'row-status-completed')).toBe(true);
  });

  test('Blocked row has correct class', async ({ authenticatedPage, apiHelper }) => {
    await createTaskAtStatus(apiHelper, projectId, 'Blocked Class', 'Blocked');
    await grid.goto();
    await grid.waitForGrid();

    expect(await grid.rowHasClass(0, 'row-status-blocked')).toBe(true);
  });

  test('Completed task cells are NOT editable', async ({ authenticatedPage, apiHelper }) => {
    await createTaskAtStatus(apiHelper, projectId, 'No Edit', 'Completed');
    await grid.goto();
    await grid.waitForGrid();

    // taskName, description, system, notes — all should be non-editable
    const editableTaskName = await grid.isCellEditable(0, 'taskName');
    const editableSystem = await grid.isCellEditable(0, 'system');
    const editableNotes = await grid.isCellEditable(0, 'notes');

    expect(editableTaskName).toBe(false);
    expect(editableSystem).toBe(false);
    expect(editableNotes).toBe(false);
  });

  test('Completed status shows lock icon', async ({ authenticatedPage, apiHelper }) => {
    await createTaskAtStatus(apiHelper, projectId, 'Lock Icon', 'Completed');
    await grid.goto();
    await grid.waitForGrid();

    const statusCell = grid.getCell(0, 'status');
    // Lock icon is an SVG with a <rect> element (the lock body)
    const lockIcon = statusCell.locator('svg rect');
    await expect(lockIcon).toBeVisible();
  });

  test('non-completed status shows chevron and editable class', async ({ authenticatedPage, apiHelper }) => {
    await apiHelper.createTask(projectId, 'Chevron Test');
    await grid.goto();
    await grid.waitForGrid();

    const statusCell = grid.getCell(0, 'status');
    // Chevron icon has class "status-edit-icon"
    const chevron = statusCell.locator('.status-edit-icon');
    await expect(chevron).toBeAttached();

    // The span should have class "status-cell-editable"
    const editableSpan = statusCell.locator('.status-cell-editable');
    await expect(editableSpan).toBeAttached();
  });

  test('invalid transition Pending->Completed rejected', async ({ authenticatedPage, apiHelper }) => {
    const task = await apiHelper.createTask(projectId, 'Bad Transition 1');

    const result = await apiHelper.updateTaskExpectError(task.id, { status: 'Completed' });
    expect(result.status).toBe(400);
    expect(JSON.stringify(result.body)).toContain('Invalid status transition');
  });

  test('invalid transition Pending->Acknowledged rejected', async ({ authenticatedPage, apiHelper }) => {
    const task = await apiHelper.createTask(projectId, 'Bad Transition 2');

    const result = await apiHelper.updateTaskExpectError(task.id, { status: 'Acknowledged' });
    expect(result.status).toBe(400);
    expect(JSON.stringify(result.body)).toContain('Invalid status transition');
  });

  test('Completed task cannot be modified via API', async ({ authenticatedPage, apiHelper }) => {
    const task = await createTaskAtStatus(apiHelper, projectId, 'Immutable', 'Completed');

    const result = await apiHelper.updateTaskExpectError(task.id, { taskName: 'Hacked' });
    expect(result.status).toBe(400);
    expect(JSON.stringify(result.body)).toContain('Cannot modify a completed task');
  });
});
