import { test, expect } from '../fixtures/auth.fixture';
import { DashboardPage } from '../page-objects/dashboard.page';
import { TaskGridPage } from '../page-objects/task-grid.page';
import { uniqueProjectCode, uniqueProjectName } from '../helpers/constants';

test.describe('Error Handling & Boundary Conditions', () => {
  test('dashboard handles API error gracefully', async ({ authenticatedPage }) => {
    // Set a fake project ID that doesn't exist
    await authenticatedPage.evaluate(() => {
      localStorage.setItem('selectedProjectId', '00000000-0000-0000-0000-000000000000');
    });

    // Intercept API to return error
    await authenticatedPage.route('**/api/tasks*', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Internal Server Error' }) }),
    );

    const dashboard = new DashboardPage(authenticatedPage);
    await dashboard.goto();

    // Should show error state or retry button, not crash
    const errorOrRetry = authenticatedPage.locator('.text-destructive, button:has-text("Retry"), button:has-text("Try Again")');
    await expect(errorOrRetry.first()).toBeVisible({ timeout: 10_000 });
  });

  test('task grid handles missing project gracefully', async ({ authenticatedPage }) => {
    await authenticatedPage.evaluate(() => {
      localStorage.removeItem('selectedProjectId');
    });

    // Prevent auto-select
    await authenticatedPage.route('**/api/projects*', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [], total: 0, page: 1, limit: 100 }) }),
    );

    const grid = new TaskGridPage(authenticatedPage);
    await grid.goto();

    await expect(grid.noProjectMessage).toBeVisible();
  });

  test('acknowledge page handles network error', async ({ page }) => {
    // Intercept all API calls to simulate network failure
    await page.route('**/api/**', (route) => route.abort('connectionrefused'));

    await page.goto('/#/acknowledge?task_id=fake&token=fake');

    // Should show error state
    const errorHeading = page.getByText('Acknowledgement Failed');
    await expect(errorHeading).toBeVisible({ timeout: 10_000 });
  });

  test('complete page handles network error', async ({ page }) => {
    await page.route('**/api/**', (route) => route.abort('connectionrefused'));

    await page.goto('/#/complete?task_id=fake&token=fake');

    const errorHeading = page.getByText('Completion Failed');
    await expect(errorHeading).toBeVisible({ timeout: 10_000 });
  });

  test('unauthenticated API call returns 401', async () => {
    const res = await fetch(`${process.env.API_URL || 'http://localhost:3009'}/api/tasks`);
    expect(res.status).toBe(401);
  });

  test('health endpoint returns ok', async () => {
    const res = await fetch(`${process.env.API_URL || 'http://localhost:3009'}/health`);
    const data = await res.json();
    expect(data.status).toBe('ok');
  });
});
