import { test, expect } from '../fixtures/auth.fixture';
import { ProfilePage } from '../page-objects/profile.page';

test.describe('Profile', () => {
  let profile: ProfilePage;

  test.beforeEach(async ({ authenticatedPage }) => {
    profile = new ProfilePage(authenticatedPage);
    await profile.goto();
  });

  test('displays user name', async ({ testUser }) => {
    await expect(profile.userName).toBeVisible();
    await expect(profile.userName).toContainText(testUser.name);
  });

  test('displays user email', async ({ testUser }) => {
    await expect(profile.userEmail).toBeVisible();
    await expect(profile.userEmail).toContainText(testUser.email);
  });

  test('displays avatar with initials', async () => {
    await expect(profile.avatar).toBeVisible();
    // Avatar should have text content (the initials)
    const text = await profile.avatar.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });

  test('shows info card with user details', async () => {
    await expect(profile.infoCard).toBeVisible();

    // Should have Name, Email, Role, User ID rows
    const nameRow = profile.getInfoRow('Name');
    await expect(nameRow).toBeVisible();

    const emailRow = profile.getInfoRow('Email');
    await expect(emailRow).toBeVisible();

    const roleRow = profile.getInfoRow('Role');
    await expect(roleRow).toBeVisible();
  });

  test('shows Coming Soon badge for password change', async () => {
    await expect(profile.comingSoonBadge).toBeVisible();
  });
});
