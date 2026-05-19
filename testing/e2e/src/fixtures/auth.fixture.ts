import * as fs from 'fs';
import { test as base, type Page } from '@playwright/test';
import { ApiHelper } from '../helpers/api.helper';
import { API_URL } from '../helpers/constants';
import { SHARED_AUTH_PATH, type SharedAuth } from '../global-setup';

/**
 * Shared test state created once per test file (worker).
 * Reads the shared user credentials created by global-setup.ts
 * to avoid hitting the register rate limit (5/min/IP).
 */
interface AuthFixtures {
  /** A Page instance with JWT already injected into localStorage. */
  authenticatedPage: Page;
  /** ApiHelper for direct API calls in test setup/teardown. */
  apiHelper: ApiHelper;
  /** The registered user's details. */
  testUser: { email: string; name: string; id: string; token: string };
}

// Lazily loaded from the shared auth file written by global-setup.ts
let sharedUser: SharedAuth | null = null;
let sharedHelper: ApiHelper | null = null;

function loadSharedAuth(): SharedAuth {
  if (!sharedUser) {
    const raw = fs.readFileSync(SHARED_AUTH_PATH, 'utf-8');
    sharedUser = JSON.parse(raw) as SharedAuth;
    sharedHelper = new ApiHelper(sharedUser.token, API_URL);
  }
  return sharedUser;
}

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    const user = loadSharedAuth();

    // Navigate to the app first so localStorage is on the right origin
    await page.goto('/');
    await page.evaluate(
      ({ token, userData }) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
      },
      {
        token: user.token,
        userData: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: 'USER',
        },
      },
    );

    await use(page);
  },

  apiHelper: async ({}, use) => {
    loadSharedAuth();
    await use(sharedHelper!);
  },

  testUser: async ({}, use) => {
    const user = loadSharedAuth();
    await use(user);
  },
});

export { expect } from '@playwright/test';
