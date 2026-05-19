import { test, expect } from '../fixtures/auth.fixture';
import { TaskGridPage } from '../page-objects/task-grid.page';
import { uniqueProjectCode, uniqueProjectName } from '../helpers/constants';

test.describe('Task Grid — Cell Editing', () => {
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

  test('edit taskName via single click', async ({ authenticatedPage, apiHelper }) => {
    const task = await apiHelper.createTask(projectId, 'Original Name');
    await grid.goto();
    await grid.waitForGrid();

    await grid.editTextCell(0, 'taskName', 'Updated Name');

    // Verify API persistence
    await expect.poll(async () => {
      const fetched = await apiHelper.getTask(task.id);
      return fetched.taskName;
    }, { timeout: 5000 }).toBe('Updated Name');
  });

  test('edit description', async ({ authenticatedPage, apiHelper }) => {
    const task = await apiHelper.createTask(projectId, 'Desc Test');
    await grid.goto();
    await grid.waitForGrid();

    await grid.editTextCell(0, 'description', 'A new description');

    await expect.poll(async () => {
      const fetched = await apiHelper.getTask(task.id);
      return (fetched as Record<string, unknown>).description;
    }, { timeout: 5000 }).toBe('A new description');
  });

  test('edit assignedTeam', async ({ authenticatedPage, apiHelper }) => {
    const task = await apiHelper.createTask(projectId, 'Team Test');
    await grid.goto();
    await grid.waitForGrid();

    await grid.editTextCell(0, 'assignedTeam', 'Platform');

    await expect.poll(async () => {
      const fetched = await apiHelper.getTask(task.id);
      return (fetched as Record<string, unknown>).assignedTeam;
    }, { timeout: 5000 }).toBe('Platform');
  });

  test('edit notes', async ({ authenticatedPage, apiHelper }) => {
    const task = await apiHelper.createTask(projectId, 'Notes Test');
    await grid.goto();
    await grid.waitForGrid();

    await grid.editTextCell(0, 'notes', 'Important note here');

    await expect.poll(async () => {
      const fetched = await apiHelper.getTask(task.id);
      return (fetched as Record<string, unknown>).notes;
    }, { timeout: 5000 }).toBe('Important note here');
  });

  test('edit system to SAP GW', async ({ authenticatedPage, apiHelper }) => {
    const task = await apiHelper.createTask(projectId, 'System Test');
    await grid.goto();
    await grid.waitForGrid();

    await grid.editSelectCell(0, 'system', 'SAP GW');

    await expect.poll(async () => {
      const fetched = await apiHelper.getTask(task.id);
      return fetched.system;
    }, { timeout: 5000 }).toBe('SAP GW');
  });

  test('edit system to Fiserv', async ({ authenticatedPage, apiHelper }) => {
    const task = await apiHelper.createTask(projectId, 'Fiserv Test');
    await grid.goto();
    await grid.waitForGrid();

    await grid.editSelectCell(0, 'system', 'Fiserv');

    await expect.poll(async () => {
      const fetched = await apiHelper.getTask(task.id);
      return fetched.system;
    }, { timeout: 5000 }).toBe('Fiserv');
  });

  test('plannedStartTime set via API renders in grid', async ({ authenticatedPage, apiHelper }) => {
    const task = await apiHelper.createTask(projectId, 'Start Time Test');
    const isoDate = '2026-06-15T09:00:00.000Z';
    await apiHelper.updateTask(task.id, { plannedStartTime: isoDate });

    await grid.goto();
    await grid.waitForGrid();

    // The DateTimeRenderer shows the date formatted via toLocaleString()
    const cellText = await grid.getCellText(0, 'plannedStartTime');
    expect(cellText).toContain('2026');
    expect(cellText).not.toBe('');
    expect(cellText).not.toContain('Click to set');
  });

  test('plannedEndTime set via API renders in grid', async ({ authenticatedPage, apiHelper }) => {
    const task = await apiHelper.createTask(projectId, 'End Time Test');
    const isoDate = '2026-06-20T17:00:00.000Z';
    await apiHelper.updateTask(task.id, { plannedEndTime: isoDate });

    await grid.goto();
    await grid.waitForGrid();

    const cellText = await grid.getCellText(0, 'plannedEndTime');
    expect(cellText).toContain('2026');
    expect(cellText).not.toBe('');
    expect(cellText).not.toContain('Click to set');
  });

  test('display ID format is projectCode-seqNum', async ({ authenticatedPage, apiHelper }) => {
    await apiHelper.createTask(projectId, 'ID Format Test');
    await grid.goto();
    await grid.waitForGrid();

    // The ID column uses a valueGetter, so col-id is the first column (pinned left)
    // AG Grid auto-assigns col-id based on field or "ag-Grid-AutoColumn"
    // For valueGetter columns without field, it uses the index. Let's read the cell.
    const idCell = grid.page.locator('.ag-row[row-index="0"] .ag-cell').first();
    const text = await idCell.textContent();
    expect(text).toMatch(new RegExp(`^${projectCode}-\\d+$`));
  });

  test('new task defaults to FOL and "New Task"', async ({ authenticatedPage, apiHelper }) => {
    await grid.goto();
    await grid.waitForGrid();

    await grid.addTaskButton.click();
    await grid.page.waitForTimeout(600);

    // Verify defaults in the grid
    const systemText = await grid.getCellText(0, 'system');
    expect(systemText).toBe('FOL');

    // The taskName cell might be in edit mode right after add; press Escape first
    await grid.page.keyboard.press('Escape');
    await grid.page.waitForTimeout(200);

    const nameText = await grid.getCellText(0, 'taskName');
    expect(nameText).toBe('New Task');
  });

  test('multiple edits on same row persist', async ({ authenticatedPage, apiHelper }) => {
    const task = await apiHelper.createTask(projectId, 'Multi Edit');
    await grid.goto();
    await grid.waitForGrid();

    // Quick succession edits — debounce should coalesce
    await grid.editTextCell(0, 'taskName', 'Renamed Task');
    await grid.editTextCell(0, 'assignedTeam', 'DevOps');

    // Wait a bit extra for coalesced update
    await grid.page.waitForTimeout(600);

    await expect.poll(async () => {
      const fetched = await apiHelper.getTask(task.id);
      return {
        name: fetched.taskName,
        team: (fetched as Record<string, unknown>).assignedTeam,
      };
    }, { timeout: 5000 }).toEqual({
      name: 'Renamed Task',
      team: 'DevOps',
    });
  });
});
