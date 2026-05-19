import { test, expect } from '../fixtures/auth.fixture';
import { TaskGridPage } from '../page-objects/task-grid.page';
import { ToastComponent } from '../page-objects/toast.component';
import { uniqueProjectCode, uniqueProjectName } from '../helpers/constants';

test.describe('Toast Notifications', () => {
  let grid: TaskGridPage;
  let toasts: ToastComponent;
  let projectId: string;

  test.beforeEach(async ({ authenticatedPage, apiHelper }) => {
    const code = uniqueProjectCode();
    const project = await apiHelper.createProject(uniqueProjectName(), code);
    projectId = project.id;

    await authenticatedPage.evaluate((pid) => {
      localStorage.setItem('selectedProjectId', pid);
    }, projectId);

    grid = new TaskGridPage(authenticatedPage);
    toasts = new ToastComponent(authenticatedPage);
  });

  test('warning toast on delete with no selection', async ({ authenticatedPage }) => {
    await grid.goto();
    await grid.waitForGrid();

    await grid.deleteSelectedButton.click();

    // Should show a warning toast about selecting rows first
    const toast = await toasts.waitForToast('Select one or more rows first');
    await expect(toast).toBeVisible();
  });

  test('toast has role="alert" and aria-live', async ({ authenticatedPage }) => {
    await grid.goto();
    await grid.waitForGrid();

    await grid.deleteSelectedButton.click();

    const toast = await toasts.waitForToast('Select one or more rows first');
    await expect(toast).toHaveAttribute('role', 'alert');
    await expect(toast).toHaveAttribute('aria-live', 'polite');
  });

  test('toast auto-dismisses after ~5s', async ({ authenticatedPage }) => {
    await grid.goto();
    await grid.waitForGrid();

    await grid.deleteSelectedButton.click();

    const toast = await toasts.waitForToast('Select one or more rows first');
    await expect(toast).toBeVisible();

    // Wait for auto-dismiss (TOAST_DURATION = 5000ms + animation time)
    await toasts.waitForNoToasts(8000);

    const remaining = await toasts.getToasts().count();
    expect(remaining).toBe(0);
  });

  test('toast positioned in top-right', async ({ authenticatedPage }) => {
    await grid.goto();
    await grid.waitForGrid();

    await grid.deleteSelectedButton.click();

    await toasts.waitForToast('Select one or more rows first');

    // The toast container is `fixed top-4 right-4 z-50`
    const container = authenticatedPage.locator('.fixed.top-4.right-4');
    await expect(container).toBeVisible();
  });
});
