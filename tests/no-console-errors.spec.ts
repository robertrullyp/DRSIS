import { test, expect } from '@playwright/test';

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

  await page.goto('/sign-in?callbackUrl=/dashboard');
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

  await page.goto('/');
  await expect(page.getByRole('heading', { name: /informasi publik/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Pengumuman PPDB/i })).toBeVisible();

  expect(consoleErrors, 'No console/page errors on root').toEqual([]);
});

test('Dashboard requires authentication (redirects to sign-in)', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(err.message));

  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/sign-in\?callbackUrl=%2Fdashboard/);
  expect(consoleErrors, 'No console/page errors when blocked from dashboard').toEqual([]);
});

test('Admin can sign in and reach dashboard without console errors', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const t = msg.text();
      // Ignore transient NextAuth fetch abort during navigation
      if (t.includes('[next-auth][error][CLIENT_FETCH_ERROR]') && t.includes('/api/auth/session')) return;
      consoleErrors.push(t);
    }
  });
  page.on('pageerror', (err) => consoleErrors.push(err.message));

  await page.goto('/sign-in?callbackUrl=/dashboard');
  await page.locator('input[type="email"]').fill('admin@sis.local');
  await page.locator('input[type="password"]').fill('admin123');
  const [resp] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/api/auth/callback/credentials')),
    page.getByRole('button', { name: /sign in/i }).click(),
  ]);
  expect(resp.ok(), 'Credentials callback should return OK').toBeTruthy();
  const cookies = await page.context().cookies();
  const hasSession = cookies.some((c) => c.name.includes('next-auth.session-token'));
  expect(hasSession, 'Session cookie should be present after login').toBeTruthy();

  // After sign-in, ensure dashboard is accessible
  await page.goto('/dashboard');
  await page.getByRole('heading', { name: /dashboard/i }).waitFor();

  expect(consoleErrors, 'No console/page errors after login to dashboard').toEqual([]);
});
