import { test, expect } from '@playwright/test';
import { LandingPage } from '../page-objects/landing.page';

test.describe('Landing Page', () => {
  let landing: LandingPage;

  test.beforeEach(async ({ page }) => {
    landing = new LandingPage(page);
    await landing.goto();
  });

  test('displays hero section with heading', async () => {
    await expect(landing.heroHeading).toBeVisible();
    await expect(landing.heroHeading).toContainText('Deploy with confidence');
  });

  test('displays brand name', async () => {
    await expect(landing.deployFlowBrand).toBeVisible();
  });

  test('displays features section', async () => {
    await expect(landing.featuresSection).toBeVisible();
  });

  test('displays how it works section', async () => {
    await expect(landing.howItWorksSection).toBeVisible();
  });

  test('Get Started button navigates to /signup', async ({ page }) => {
    await landing.getStartedButton.first().click();
    await expect(page).toHaveURL(/#\/signup/);
  });

  test('Login link navigates to /login', async ({ page }) => {
    // The navbar Login link
    const loginLink = page.locator('nav').getByRole('link', { name: 'Login' });
    await loginLink.click();
    await expect(page).toHaveURL(/#\/login/);
  });

  test('shows Go to Dashboard when logged in', async ({ page }) => {
    // Intercept all API calls to prevent 401 redirect when using a fake token
    await page.route('**/api/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [], total: 0 }) }),
    );

    // Inject a token to simulate logged-in state
    await page.evaluate(() => {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(
        JSON.stringify({ sub: 'test', email: 'test@test.com', exp: Math.floor(Date.now() / 1000) + 3600 }),
      );
      const sig = 'testsig';
      localStorage.setItem('token', `${header}.${payload}.${sig}`);
    });

    await page.reload();
    const dashLink = page.getByRole('link', { name: /go to dashboard/i }).first();
    await expect(dashLink).toBeVisible();
  });
});
