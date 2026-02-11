import { test, expect, type Page } from '@playwright/test';

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@sis.local';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'admin123';

async function gotoStable(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
}

async function hasSessionCookie(page: Page) {
  const cookies = await page.context().cookies();
  return cookies.some((cookie) => cookie.name.includes('next-auth.session-token'));
}

async function waitForSession(page: Page, timeoutMs = 20_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await hasSessionCookie(page)) {
      return true;
    }
    await page.waitForTimeout(300);
  }
  return false;
}

async function signInViaNextAuthApi(page: Page) {
  const csrfResponse = await page.request.get("/api/auth/csrf");
  if (!csrfResponse.ok()) return false;

  const csrfPayload = (await csrfResponse.json().catch(() => null)) as { csrfToken?: string } | null;
  const csrfToken = csrfPayload?.csrfToken;
  if (!csrfToken) return false;

  const callbackResponse = await page.request.post("/api/auth/callback/credentials?json=true", {
    form: {
      csrfToken,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      callbackUrl: "/dashboard",
      json: "true",
    },
  });

  if (!callbackResponse.ok()) return false;
  await page.waitForTimeout(400);
  return waitForSession(page, 8_000);
}

test('Sign-in page renders without console errors', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
  });

  await gotoStable(page, '/sign-in?callbackUrl=/dashboard');
  await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();

  expect(consoleErrors, 'No console/page errors on /sign-in').toEqual([]);
});

test('Root shows public landing without console errors', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
  });

  await gotoStable(page, '/');
  await expect(page.locator('main h1').first()).toBeVisible();
  await expect(page.getByRole('link', { name: /Pengumuman PPDB/i })).toBeVisible();

  expect(consoleErrors, 'No console/page errors on root').toEqual([]);
});

test('Dashboard requires authentication (redirects to sign-in)', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(err.message));

  await gotoStable(page, '/dashboard');
  await expect(page).toHaveURL(/\/sign-in\?callbackUrl=%2Fdashboard/);
  expect(consoleErrors, 'No console/page errors when blocked from dashboard').toEqual([]);
});

test('Admin can sign in and reach dashboard without console errors', async ({ page }) => {
  test.setTimeout(180_000);

  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const t = msg.text();
      // Ignore transient NextAuth fetch abort during navigation
      if (t.includes('[next-auth][error][CLIENT_FETCH_ERROR]') && t.includes('/api/auth/session')) return;
      // Ignore expected unauthorized fetch from guarded endpoints during initial dashboard hydration.
      if (t.includes('Failed to load resource: the server responded with a status of 401')) return;
      consoleErrors.push(t);
    }
  });
  page.on('pageerror', (err) => consoleErrors.push(err.message));

  let authenticated = false;
  authenticated = await signInViaNextAuthApi(page);

  for (let attempt = 1; attempt <= 3 && !authenticated; attempt += 1) {
    await gotoStable(page, '/sign-in?callbackUrl=/dashboard');
    await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
    await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);

    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForTimeout(1_000);
    const hasSession = await waitForSession(page, 10_000);
    if (hasSession) {
      authenticated = true;
      break;
    }

    await page.waitForTimeout(1_000);
  }

  expect(authenticated, 'Admin sign-in should succeed within retry window').toBeTruthy();

  // After sign-in, ensure dashboard is accessible
  await gotoStable(page, '/dashboard');
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
  await page.getByRole('heading', { name: /dashboard/i }).waitFor({ timeout: 30_000 });

  expect(consoleErrors, 'No console/page errors after login to dashboard').toEqual([]);
});
