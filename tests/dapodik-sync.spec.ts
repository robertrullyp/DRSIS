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
    if (await hasSessionCookie(page)) return true;
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
  expect(authenticated, "Admin sign-in should succeed").toBeTruthy();
}

test.describe.configure({ timeout: 240_000 });

test("Admin can enqueue and process Dapodik sync batch (mock) and staging rows appear", async ({ page }) => {
  await loginAsAdmin(page);

  const kind = `E2E_TEST_${Date.now()}`;
  const enqueueRes = await page.request.post("/api/admin/dapodik/batches", {
    data: { kind },
  });
  expect(enqueueRes.ok(), "Enqueue batch should succeed").toBeTruthy();
  const batch = (await enqueueRes.json()) as { id: string; kind: string; status: string };
  expect(batch.id, "Batch id should exist").toBeTruthy();

  const processRes = await page.request.post("/api/admin/dapodik/process?limit=20");
  expect(processRes.ok(), "Process queue should succeed").toBeTruthy();
  const processPayload = (await processRes.json()) as {
    processed: number;
    results: Record<string, string>;
    skipped?: boolean;
    error?: string;
  };
  expect(processPayload.skipped, "Dapodik sync should be enabled in E2E env").not.toBeTruthy();
  expect(processPayload.error, "Dapodik queue process should not return error").toBeFalsy();
  expect(Object.keys(processPayload.results)).toContain(batch.id);

  const stagingRes = await page.request.get(
    `/api/admin/dapodik/staging?page=1&pageSize=50&batchId=${encodeURIComponent(batch.id)}`,
  );
  expect(stagingRes.ok(), "Staging list should succeed").toBeTruthy();
  const stagingPayload = (await stagingRes.json()) as { items?: Array<{ entityType?: string }>; total?: number };
  expect(stagingPayload.total ?? 0).toBeGreaterThanOrEqual(3);

  const entityTypes = new Set((stagingPayload.items ?? []).map((it) => String(it.entityType || "")));
  expect(entityTypes.has("school")).toBeTruthy();
  expect(entityTypes.has("teacher")).toBeTruthy();
  expect(entityTypes.has("student")).toBeTruthy();
});

