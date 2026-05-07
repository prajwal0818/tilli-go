import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/login.page';
import { SignUpPage } from '../page-objects/signup.page';
import { uniqueEmail, uniqueName, TEST_PASSWORD } from '../helpers/constants';

test.describe('Authentication', () => {
  test('signup navigates to dashboard on success', async ({ page }) => {
    const signup = new SignUpPage(page);
    await signup.goto();

    const email = uniqueEmail();
    const name = uniqueName();
    await signup.signUp(name, email, TEST_PASSWORD);

    await expect(page).toHaveURL(/#\/dashboard/, { timeout: 10_000 });
    // Token should be stored
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();
  });

  test('login navigates to dashboard on success', async ({ page }) => {
    // First register a user
    const signup = new SignUpPage(page);
    await signup.goto();
    const email = uniqueEmail();
    const name = uniqueName();
    await signup.signUp(name, email, TEST_PASSWORD);
    await expect(page).toHaveURL(/#\/dashboard/, { timeout: 10_000 });

    // Clear token and go to login
    await page.evaluate(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    });

    const login = new LoginPage(page);
    await login.goto();
    await login.login(email, TEST_PASSWORD);

    await expect(page).toHaveURL(/#\/dashboard/, { timeout: 10_000 });
  });

  test('login shows error on wrong password', async ({ page }) => {
    // Register first
    const signup = new SignUpPage(page);
    await signup.goto();
    const email = uniqueEmail();
    await signup.signUp(uniqueName(), email, TEST_PASSWORD);
    await expect(page).toHaveURL(/#\/dashboard/, { timeout: 10_000 });

    // Logout and try wrong password
    await page.evaluate(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    });

    const login = new LoginPage(page);
    await login.goto();
    await login.login(email, 'WrongPassword999');

    await expect(login.errorMessage).toBeVisible();
    await expect(login.errorMessage).toContainText(/invalid/i);
  });

  test('signup shows client-side error on password mismatch', async ({ page }) => {
    const signup = new SignUpPage(page);
    await signup.goto();

    await signup.signUp(uniqueName(), uniqueEmail(), TEST_PASSWORD, 'DifferentPass1');

    await expect(signup.errorMessage).toBeVisible();
    await expect(signup.errorMessage).toContainText(/do not match/i);
  });

  test('protected route redirects to login when not authenticated', async ({ page }) => {
    // Ensure no token
    await page.goto('/#/');
    await page.evaluate(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    });

    await page.goto('/#/dashboard');
    await expect(page).toHaveURL(/#\/login/);
  });

  test('logout clears token and redirects to login', async ({ page }) => {
    // Register and login first
    const signup = new SignUpPage(page);
    await signup.goto();
    await signup.signUp(uniqueName(), uniqueEmail(), TEST_PASSWORD);
    await expect(page).toHaveURL(/#\/dashboard/, { timeout: 10_000 });

    // Click logout in sidebar
    const logoutButton = page.locator('aside').getByRole('button', { name: /logout/i });
    await logoutButton.click();

    await expect(page).toHaveURL(/#\/login/);
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeNull();
  });

  test('token persists on page refresh', async ({ page }) => {
    const signup = new SignUpPage(page);
    await signup.goto();
    await signup.signUp(uniqueName(), uniqueEmail(), TEST_PASSWORD);
    await expect(page).toHaveURL(/#\/dashboard/, { timeout: 10_000 });

    const tokenBefore = await page.evaluate(() => localStorage.getItem('token'));
    await page.reload();

    // Should still be on dashboard (not redirected to login)
    await expect(page).toHaveURL(/#\/dashboard/);
    const tokenAfter = await page.evaluate(() => localStorage.getItem('token'));
    expect(tokenAfter).toBe(tokenBefore);
  });
});
