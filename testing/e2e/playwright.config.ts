import { defineConfig } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment-specific .env file
const testEnv = process.env.TEST_ENV || 'local';
dotenv.config({ path: path.resolve(__dirname, `.env.${testEnv}`) });

export default defineConfig({
  globalSetup: './src/global-setup.ts',
  testDir: './src/specs',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 10_000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        viewport: { width: 1280, height: 720 },
      },
    },
  ],
});
