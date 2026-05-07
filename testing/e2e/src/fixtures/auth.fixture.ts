import { test as base, type Page } from '@playwright/test';
import { ApiHelper } from '../helpers/api.helper';
import { API_URL, TEST_PASSWORD, uniqueEmail, uniqueName } from '../helpers/constants';

/**
 * Shared test state created once per test file (worker).
 * Registers a unique user and provides an authenticated page + API helper.
 */
interface AuthFixtures {
  /** A Page instance with JWT already injected into localStorage. */
  authenticatedPage: Page;
  /** ApiHelper for direct API calls in test setup/teardown. */
  apiHelper: ApiHelper;
  /** The registered user's details. */
  testUser: { email: string; name: string; id: string; token: string };
}

// Create a single user per worker (test file) to avoid conflicts
let sharedUser: { email: string; name: string; id: string; token: string } | null = null;
let sharedHelper: ApiHelper | null = null;

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    if (!sharedUser) {
      const email = uniqueEmail();
      const name = uniqueName();
      const { helper, user } = await ApiHelper.register(email, TEST_PASSWORD, name, API_URL);
      const { token } = await ApiHelper.login(email, TEST_PASSWORD, API_URL);
      sharedUser = { email, name, id: user.id, token };
      sharedHelper = helper;
    }

    // Inject token and user data into localStorage before navigating
    const baseURL = page.context().pages()[0]?.url() || process.env.BASE_URL || 'http://localhost:3000';
    // Navigate to the app first so localStorage is on the right origin
    await page.goto('/');
    await page.evaluate(
      ({ token, user }) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      },
      {
        token: sharedUser.token,
        user: {
          id: sharedUser.id,
          email: sharedUser.email,
          name: sharedUser.name,
          role: 'USER',
        },
      },
    );

    await use(page);
  },

  apiHelper: async ({}, use) => {
    if (!sharedHelper) {
      const email = uniqueEmail();
      const name = uniqueName();
      const { helper } = await ApiHelper.register(email, TEST_PASSWORD, name, API_URL);
      sharedHelper = helper;
    }
    await use(sharedHelper);
  },

  testUser: async ({}, use) => {
    if (!sharedUser) {
      const email = uniqueEmail();
      const name = uniqueName();
      const { helper, user } = await ApiHelper.register(email, TEST_PASSWORD, name, API_URL);
      const { token } = await ApiHelper.login(email, TEST_PASSWORD, API_URL);
      sharedUser = { email, name, id: user.id, token };
      sharedHelper = helper;
    }
    await use(sharedUser);
  },
});

export { expect } from '@playwright/test';
