import { test, expect } from '../fixtures/auth.fixture';
import { SidebarComponent } from '../page-objects/sidebar.component';
import { HeaderComponent } from '../page-objects/header.component';

test.describe('Navigation', () => {
  let sidebar: SidebarComponent;
  let header: HeaderComponent;

  test.beforeEach(async ({ authenticatedPage }) => {
    sidebar = new SidebarComponent(authenticatedPage);
    header = new HeaderComponent(authenticatedPage);
    await authenticatedPage.goto('/#/dashboard');
    await expect(sidebar.sidebar).toBeVisible();
  });

  test('sidebar Dashboard link navigates to /dashboard', async ({ authenticatedPage }) => {
    await sidebar.navigateTo('Projects');
    await expect(authenticatedPage).toHaveURL(/#\/projects/);

    await sidebar.navigateTo('Dashboard');
    await expect(authenticatedPage).toHaveURL(/#\/dashboard/);
  });

  test('sidebar Projects link navigates to /projects', async ({ authenticatedPage }) => {
    await sidebar.navigateTo('Projects');
    await expect(authenticatedPage).toHaveURL(/#\/projects/);
  });

  test('sidebar Tasks link navigates to /tasks', async ({ authenticatedPage }) => {
    await sidebar.navigateTo('Tasks');
    await expect(authenticatedPage).toHaveURL(/#\/tasks/);
  });

  test('sidebar Profile link navigates to /profile', async ({ authenticatedPage }) => {
    await sidebar.navigateTo('Profile');
    await expect(authenticatedPage).toHaveURL(/#\/profile/);
  });

  test('active link is highlighted', async ({ authenticatedPage }) => {
    await sidebar.navigateTo('Projects');
    await expect(authenticatedPage).toHaveURL(/#\/projects/);

    const activeLink = sidebar.getActiveLink();
    await expect(activeLink).toContainText('Projects');
  });

  test('sidebar collapse persists on reload', async ({ authenticatedPage }) => {
    // Collapse sidebar
    await sidebar.toggleCollapse();

    // Verify collapsed state is stored
    const collapsed = await authenticatedPage.evaluate(() => localStorage.getItem('sidebarCollapsed'));
    expect(collapsed).toBe('true');

    // Reload
    await authenticatedPage.reload();

    // Should still be collapsed
    const collapsedAfter = await authenticatedPage.evaluate(() => localStorage.getItem('sidebarCollapsed'));
    expect(collapsedAfter).toBe('true');

    // Expand it back for other tests
    await sidebar.toggleCollapse();
  });

  test('header shows correct page title for each route', async ({ authenticatedPage }) => {
    // Dashboard
    await sidebar.navigateTo('Dashboard');
    await expect(header.pageTitle).toHaveText('Dashboard');

    // Projects
    await sidebar.navigateTo('Projects');
    await expect(header.pageTitle).toHaveText('Projects');

    // Tasks
    await sidebar.navigateTo('Tasks');
    await expect(header.pageTitle).toHaveText('Task Management');

    // Profile
    await sidebar.navigateTo('Profile');
    await expect(header.pageTitle).toHaveText('Profile');
  });
});
