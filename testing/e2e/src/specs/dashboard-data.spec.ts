import { test, expect } from '../fixtures/auth.fixture';
import { DashboardPage } from '../page-objects/dashboard.page';
import { uniqueProjectCode, uniqueProjectName, createTaskAtStatus } from '../helpers/constants';

test.describe('Dashboard — Data Accuracy', () => {
  let dashboard: DashboardPage;
  let projectId: string;

  test.beforeEach(async ({ authenticatedPage, apiHelper }) => {
    const code = uniqueProjectCode();
    const project = await apiHelper.createProject(uniqueProjectName(), code);
    projectId = project.id;

    await authenticatedPage.evaluate((pid) => {
      localStorage.setItem('selectedProjectId', pid);
    }, projectId);

    dashboard = new DashboardPage(authenticatedPage);
  });

  test('status card counts match task data', async ({ authenticatedPage, apiHelper }) => {
    // Create tasks in different statuses
    await apiHelper.createTask(projectId, 'Pending 1');
    await apiHelper.createTask(projectId, 'Pending 2');
    await createTaskAtStatus(apiHelper, projectId, 'Triggered 1', 'Triggered');
    await createTaskAtStatus(apiHelper, projectId, 'Completed 1', 'Completed');

    await dashboard.goto();
    await expect(dashboard.overviewHeading).toBeVisible({ timeout: 10_000 });

    const pendingCount = await dashboard.getStatusCardCountByAria('Pending');
    const triggeredCount = await dashboard.getStatusCardCountByAria('Triggered');
    const completedCount = await dashboard.getStatusCardCountByAria('Completed');

    expect(pendingCount).toBe(2);
    expect(triggeredCount).toBe(1);
    expect(completedCount).toBe(1);
  });

  test('pie chart center shows correct total', async ({ authenticatedPage, apiHelper }) => {
    await apiHelper.createTask(projectId, 'T1');
    await apiHelper.createTask(projectId, 'T2');
    await apiHelper.createTask(projectId, 'T3');

    await dashboard.goto();
    await expect(dashboard.overviewHeading).toBeVisible({ timeout: 10_000 });

    const totalText = await dashboard.pieChartTotal.textContent();
    expect(totalText?.trim()).toBe('3');
  });

  test('pie chart shows "No tasks" for empty project', async ({ authenticatedPage, apiHelper }) => {
    // No tasks created — project is empty
    await dashboard.goto();
    await expect(dashboard.overviewHeading).toBeVisible({ timeout: 10_000 });

    await expect(dashboard.noTasksChartMessage).toBeVisible();
  });

  test('recent tasks table shows task names', async ({ authenticatedPage, apiHelper }) => {
    await apiHelper.createTask(projectId, 'Visible Task');

    await dashboard.goto();
    await expect(dashboard.overviewHeading).toBeVisible({ timeout: 10_000 });

    // Second column (index 1) is the task name
    const nameCell = dashboard.getRecentTaskCell(0, 1);
    await expect(nameCell).toContainText('Visible Task');
  });

  test('recent tasks shows correct system and status', async ({ authenticatedPage, apiHelper }) => {
    await apiHelper.createTask(projectId, 'Status Check', 'FOL');

    await dashboard.goto();
    await expect(dashboard.overviewHeading).toBeVisible({ timeout: 10_000 });

    // Column 2 = System, Column 4 = Status
    const systemCell = dashboard.getRecentTaskCell(0, 2);
    const statusCell = dashboard.getRecentTaskCell(0, 4);

    await expect(systemCell).toContainText('FOL');
    await expect(statusCell).toContainText('Pending');
  });

  test('recent tasks empty state message', async ({ authenticatedPage, apiHelper }) => {
    await dashboard.goto();
    await expect(dashboard.overviewHeading).toBeVisible({ timeout: 10_000 });

    await expect(dashboard.emptyMessage).toBeVisible();
  });

  test('recent tasks limited to 8 entries', async ({ authenticatedPage, apiHelper }) => {
    // Create 10 tasks
    for (let i = 1; i <= 10; i++) {
      await apiHelper.createTask(projectId, `Task ${i}`);
    }

    await dashboard.goto();
    await expect(dashboard.overviewHeading).toBeVisible({ timeout: 10_000 });

    const rows = dashboard.getRecentTaskRows();
    await expect(rows).toHaveCount(8, { timeout: 5000 });
  });

  test('status card click navigates to /tasks', async ({ authenticatedPage, apiHelper }) => {
    await apiHelper.createTask(projectId, 'Nav Test');

    await dashboard.goto();
    await expect(dashboard.overviewHeading).toBeVisible({ timeout: 10_000 });

    const pendingCard = dashboard.getStatusCard('Pending');
    await pendingCard.click();

    await authenticatedPage.waitForURL('**/tasks', { timeout: 5000 });
    expect(authenticatedPage.url()).toContain('/tasks');
  });

  test('card counts update after adding task', async ({ authenticatedPage, apiHelper }) => {
    await dashboard.goto();
    await expect(dashboard.overviewHeading).toBeVisible({ timeout: 10_000 });

    // Initially 0 Pending tasks
    const initialCount = await dashboard.getStatusCardCountByAria('Pending');
    expect(initialCount).toBe(0);

    // Add a task via API
    await apiHelper.createTask(projectId, 'New One');

    // Reload to see updated count
    await dashboard.goto();
    await expect(dashboard.overviewHeading).toBeVisible({ timeout: 10_000 });

    const updatedCount = await dashboard.getStatusCardCountByAria('Pending');
    expect(updatedCount).toBe(1);
  });

  test('all cards show 0 for empty project', async ({ authenticatedPage, apiHelper }) => {
    await dashboard.goto();
    await expect(dashboard.overviewHeading).toBeVisible({ timeout: 10_000 });

    for (const status of ['Pending', 'Triggered', 'Acknowledged', 'Completed', 'Blocked']) {
      const count = await dashboard.getStatusCardCountByAria(status);
      expect(count).toBe(0);
    }
  });
});
