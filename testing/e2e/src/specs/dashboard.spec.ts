import { test, expect } from '../fixtures/auth.fixture';
import { DashboardPage } from '../page-objects/dashboard.page';
import { HeaderComponent } from '../page-objects/header.component';
import { uniqueProjectCode, uniqueProjectName } from '../helpers/constants';

test.describe('Dashboard', () => {
  let dashboard: DashboardPage;

  test('shows no-project message when no project selected', async ({ authenticatedPage }) => {
    // Clear selected project
    await authenticatedPage.evaluate(() => {
      localStorage.removeItem('selectedProjectId');
    });

    // Intercept the projects API to return an empty list so auto-select doesn't kick in
    await authenticatedPage.route('**/api/projects*', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [], total: 0, page: 1, limit: 100 }) }),
    );

    dashboard = new DashboardPage(authenticatedPage);
    await dashboard.goto();

    await expect(dashboard.noProjectMessage).toBeVisible();
  });

  test('displays overview heading with project selected', async ({ authenticatedPage, apiHelper }) => {
    // Create a project and select it
    const code = uniqueProjectCode();
    const project = await apiHelper.createProject(uniqueProjectName(), code);

    await authenticatedPage.evaluate((pid) => {
      localStorage.setItem('selectedProjectId', pid);
    }, project.id);

    dashboard = new DashboardPage(authenticatedPage);
    await dashboard.goto();

    await expect(dashboard.overviewHeading).toBeVisible({ timeout: 10_000 });
  });

  test('displays status cards', async ({ authenticatedPage, apiHelper }) => {
    const code = uniqueProjectCode();
    const project = await apiHelper.createProject(uniqueProjectName(), code);
    await apiHelper.createTask(project.id, 'Dashboard Test Task');

    await authenticatedPage.evaluate((pid) => {
      localStorage.setItem('selectedProjectId', pid);
    }, project.id);

    dashboard = new DashboardPage(authenticatedPage);
    await dashboard.goto();

    await expect(dashboard.overviewHeading).toBeVisible({ timeout: 10_000 });
    // Should have 5 status cards (Pending, Triggered, Acknowledged, Completed, Blocked)
    await expect(dashboard.statusCards).toHaveCount(5);
  });

  test('displays pie chart', async ({ authenticatedPage, apiHelper }) => {
    const code = uniqueProjectCode();
    const project = await apiHelper.createProject(uniqueProjectName(), code);
    await apiHelper.createTask(project.id, 'Pie Chart Task');

    await authenticatedPage.evaluate((pid) => {
      localStorage.setItem('selectedProjectId', pid);
    }, project.id);

    dashboard = new DashboardPage(authenticatedPage);
    await dashboard.goto();

    await expect(dashboard.overviewHeading).toBeVisible({ timeout: 10_000 });
    await expect(dashboard.pieChart).toBeVisible();
  });

  test('displays recent tasks table', async ({ authenticatedPage, apiHelper }) => {
    const code = uniqueProjectCode();
    const project = await apiHelper.createProject(uniqueProjectName(), code);
    await apiHelper.createTask(project.id, 'Recent Task 1');

    await authenticatedPage.evaluate((pid) => {
      localStorage.setItem('selectedProjectId', pid);
    }, project.id);

    dashboard = new DashboardPage(authenticatedPage);
    await dashboard.goto();

    await expect(dashboard.recentTasksHeading).toBeVisible({ timeout: 10_000 });
    await expect(dashboard.recentTasksTable).toBeVisible();
  });
});
