import { defineConfig, devices } from '@playwright/test';

const defaultE2eDatabaseUrl = 'mysql://sis:sis@127.0.0.1:3307/sis?connect_timeout=5';
const e2eDatabaseUrl = process.env.E2E_DATABASE_URL || defaultE2eDatabaseUrl;
process.env.E2E_DATABASE_URL = e2eDatabaseUrl;

export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: false,
  timeout: 60_000,
  /* Retry on CI only */
  retries: 0,
  /* Opt out of parallel tests on CI. */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'list',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    headless: true,
    navigationTimeout: 45_000,
  },
  /* Configure projects for major browsers */
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  /* Start dev server before running tests */
  webServer: {
    command: 'npm run dev -- -p 3000',
    url: 'http://localhost:3000',
    timeout: 120_000,
    reuseExistingServer: true,
    env: {
      ...process.env,
      DATABASE_URL: e2eDatabaseUrl,
      E2E_DATABASE_URL: e2eDatabaseUrl,
    },
  },
  /* Prepare database before tests */
  globalSetup: './tests/global-setup.ts',
});
