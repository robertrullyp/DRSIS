import { test, expect, type Page } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@sis.local";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "admin123";

async function gotoStable(page: Page, path: string) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await page.goto(path, { waitUntil: "domcontentloaded", timeout: 120_000 });
      return;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await page.waitForTimeout(1_200);
    }
  }
  throw lastError;
}

async function hasSessionCookie(page: Page) {
  const cookies = await page.context().cookies();
  return cookies.some((cookie) => cookie.name.includes("next-auth.session-token"));
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

async function loginAsAdmin(page: Page) {
  let authenticated = await signInViaNextAuthApi(page);
  for (let attempt = 1; attempt <= 3 && !authenticated; attempt += 1) {
    await gotoStable(page, "/sign-in?callbackUrl=/dashboard");
    await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
    await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForTimeout(1_000);
    authenticated = await waitForSession(page, 10_000);
  }

  expect(authenticated, "Admin sign-in should succeed before CMS checks").toBeTruthy();
}

test.describe.configure({ timeout: 240_000 });

test("Public CMS pages can be accessed", async ({ page }) => {
  await gotoStable(page, "/berita");
  await expect(page.getByRole("heading", { name: /Berita & Artikel/i })).toBeVisible();

  await gotoStable(page, "/agenda");
  await expect(page.getByRole("heading", { name: /Agenda Sekolah/i })).toBeVisible();

  await gotoStable(page, "/galeri");
  await expect(page.getByRole("heading", { name: /Galeri Kegiatan/i })).toBeVisible();

  await gotoStable(page, "/kontak");
  await expect(page.getByRole("heading", { name: /Hubungi Kami/i })).toBeVisible();
});

test("Admin CMS pages are guarded for unauthenticated users", async ({ page }) => {
  await gotoStable(page, "/admin/cms/posts");
  await expect(page).toHaveURL(/\/sign-in\?/);
  await expect(page.url()).toContain("callbackUrl=");
});

test("Admin can open core CMS pages", async ({ page }) => {
  await loginAsAdmin(page);

  await gotoStable(page, "/admin/cms/posts");
  await expect(page.getByRole("heading", { name: /CMS Posts/i })).toBeVisible();

  await gotoStable(page, "/admin/cms/events");
  await expect(page.getByRole("heading", { name: /CMS Events/i })).toBeVisible();

  await gotoStable(page, "/admin/cms/pages");
  await expect(page.getByRole("heading", { name: /CMS Pages/i })).toBeVisible();
});
