import type { Page, Locator } from '@playwright/test';

export class SidebarComponent {
  readonly page: Page;
  readonly sidebar: Locator;
  readonly dashboardLink: Locator;
  readonly projectsLink: Locator;
  readonly tasksLink: Locator;
  readonly profileLink: Locator;
  readonly logoutButton: Locator;
  readonly collapseButton: Locator;
  readonly brand: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = page.locator('aside');
    this.dashboardLink = this.sidebar.getByRole('link', { name: 'Dashboard' });
    this.projectsLink = this.sidebar.getByRole('link', { name: 'Projects' });
    this.tasksLink = this.sidebar.getByRole('link', { name: 'Tasks' });
    this.profileLink = this.sidebar.getByRole('link', { name: 'Profile' });
    this.logoutButton = this.sidebar.getByRole('button', { name: /logout/i });
    this.collapseButton = this.sidebar.getByLabel(/collapse sidebar|expand sidebar/i);
    this.brand = this.sidebar.getByText('DeployFlow');
  }

  /** Get the active (highlighted) navigation link. */
  getActiveLink(): Locator {
    return this.sidebar.locator('a.bg-blue-600');
  }

  async navigateTo(target: 'Dashboard' | 'Projects' | 'Tasks' | 'Profile') {
    const links: Record<string, Locator> = {
      Dashboard: this.dashboardLink,
      Projects: this.projectsLink,
      Tasks: this.tasksLink,
      Profile: this.profileLink,
    };
    await links[target].click();
  }

  async toggleCollapse() {
    await this.collapseButton.click();
  }

  async logout() {
    await this.logoutButton.click();
  }
}
