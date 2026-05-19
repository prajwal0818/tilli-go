import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/login.page';
import { SignUpPage } from '../page-objects/signup.page';
import { uniqueEmail, uniqueName, TEST_PASSWORD, API_URL } from '../helpers/constants';
import { ApiHelper } from '../helpers/api.helper';
import { SHARED_AUTH_PATH, type SharedAuth } from '../global-setup';
import * as fs from 'fs';

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
    // Register via API to avoid rate limits
    const email = uniqueEmail();
    const name = uniqueName();
    await ApiHelper.register(email, TEST_PASSWORD, name, API_URL);

    const login = new LoginPage(page);
    await login.goto();
    await login.login(email, TEST_PASSWORD);

    await expect(page).toHaveURL(/#\/dashboard/, { timeout: 10_000 });
  });

  test('login shows error on wrong password', async ({ page }) => {
    // Register via API to avoid rate limits
    const email = uniqueEmail();
    await ApiHelper.register(email, TEST_PASSWORD, uniqueName(), API_URL);

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
    // Use shared auth credentials to avoid registration
    const raw = fs.readFileSync(SHARED_AUTH_PATH, 'utf-8');
    const sharedUser: SharedAuth = JSON.parse(raw);

    await page.goto('/#/');
    await page.evaluate(
      ({ token, userData }) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
      },
      {
        token: sharedUser.token,
        userData: { id: sharedUser.id, email: sharedUser.email, name: sharedUser.name, role: 'USER' },
      },
    );

    await page.goto('/#/dashboard');
    await page.reload();

    // Click logout in sidebar
    const logoutButton = page.locator('aside').getByRole('button', { name: /logout/i });
    await logoutButton.click();

    await expect(page).toHaveURL(/#\/login/);
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeNull();
  });

  test('token persists on page refresh', async ({ page }) => {
    // Use shared auth credentials to avoid registration
    const raw = fs.readFileSync(SHARED_AUTH_PATH, 'utf-8');
    const sharedUser: SharedAuth = JSON.parse(raw);

    await page.goto('/#/');
    await page.evaluate(
      ({ token, userData }) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
      },
      {
        token: sharedUser.token,
        userData: { id: sharedUser.id, email: sharedUser.email, name: sharedUser.name, role: 'USER' },
      },
    );

    await page.goto('/#/dashboard');
    await page.reload();
    await expect(page).toHaveURL(/#\/dashboard/);

    const tokenBefore = await page.evaluate(() => localStorage.getItem('token'));
    await page.reload();

    // Should still be on dashboard (not redirected to login)
    await expect(page).toHaveURL(/#\/dashboard/);
    const tokenAfter = await page.evaluate(() => localStorage.getItem('token'));
    expect(tokenAfter).toBe(tokenBefore);
  });
});
