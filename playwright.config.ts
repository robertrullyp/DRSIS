import { defineConfig, devices } from '@playwright/test';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

function withConnectTimeout(url: string) {
  if (!url) return url;
  if (/connect_timeout=/i.test(url)) return url;
  return `${url}${url.includes('?') ? '&' : '?'}connect_timeout=5`;
}

const defaultE2eDatabaseUrl = process.env.DATABASE_URL || 'mysql://sis:sis@127.0.0.1:3306/sis';
const e2eDatabaseUrl = withConnectTimeout(process.env.E2E_DATABASE_URL || defaultE2eDatabaseUrl);
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
    command: 'bash tests/e2e-webserver.sh',
    url: 'http://localhost:3000',
    timeout: 240_000,
    reuseExistingServer: false,
    env: {
      ...process.env,
      DATABASE_URL: e2eDatabaseUrl,
      E2E_DATABASE_URL: e2eDatabaseUrl,
      NEXTAUTH_URL: 'http://localhost:3000',
    },
  },
});
