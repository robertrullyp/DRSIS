import { test, expect, type Page } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@sis.local";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "admin123";
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

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
  const csrfPayload = (await csrfResponse.json().catch(() => null)) as
    | { csrfToken?: string }
    | null;
  const csrfToken = csrfPayload?.csrfToken;
  if (!csrfToken) return false;

  const callbackResponse = await page.request.post(
    "/api/auth/callback/credentials?json=true",
    {
      form: {
        csrfToken,
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        callbackUrl: "/dashboard",
        json: "true",
      },
    },
  );

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

test("Public webhooks can update WA/Email outbox status", async ({ page }) => {
  await loginAsAdmin(page);

  const waTo = `wa-test-${Date.now()}`;
  const emailTo = `test-${Date.now()}@example.com`;

  // Enqueue WA
  const waEnqueue = await page.request.post("/api/admin/wa/send-test", {
    data: {
      to: waTo,
      key: "test",
      payload: { text: "Hello WA" },
    },
  });
  expect(waEnqueue.ok(), "WA enqueue should succeed").toBeTruthy();

  // Send WA (creates providerMsgId and sets status=SENT)
  const waSend = await page.request.post("/api/admin/wa/outbox/send?limit=10");
  expect(waSend.ok(), "WA send should succeed").toBeTruthy();

  const waList = await page.request.get(`/api/admin/wa/outbox?to=${encodeURIComponent(waTo)}`);
  expect(waList.ok(), "WA outbox list should succeed").toBeTruthy();
  const waListPayload = (await waList.json()) as { items?: any[] };
  const waItem = (waListPayload.items || []).find((i) => i.to === waTo);
  expect(waItem, "WA outbox item should exist").toBeTruthy();
  expect(waItem.providerMsgId, "WA providerMsgId should exist").toBeTruthy();

  const waWebhook = await page.request.post("/api/public/wa/webhook", {
    data: { providerMsgId: waItem.providerMsgId, status: "delivered" },
    headers: WEBHOOK_SECRET ? { "x-webhook-key": WEBHOOK_SECRET } : undefined,
  });
  expect(waWebhook.ok(), "WA webhook should succeed").toBeTruthy();

  const waListAfter = await page.request.get(`/api/admin/wa/outbox?to=${encodeURIComponent(waTo)}`);
  const waAfterPayload = (await waListAfter.json()) as { items?: any[] };
  const waAfter = (waAfterPayload.items || []).find((i) => i.to === waTo);
  expect(waAfter?.status).toBe("DELIVERED");

  // Enqueue Email
  const emailEnqueue = await page.request.post("/api/admin/email/send-test", {
    data: {
      to: emailTo,
      key: "test",
      subject: "Test Subject",
      payload: { html: "<b>Hello Email</b>" },
    },
  });
  expect(emailEnqueue.ok(), "Email enqueue should succeed").toBeTruthy();

  // Send Email (creates providerMsgId and sets status=SENT)
  const emailSend = await page.request.post("/api/admin/email/outbox/send?limit=10");
  expect(emailSend.ok(), "Email send should succeed").toBeTruthy();

  const emailList = await page.request.get(`/api/admin/email/outbox?to=${encodeURIComponent(emailTo)}`);
  expect(emailList.ok(), "Email outbox list should succeed").toBeTruthy();
  const emailListPayload = (await emailList.json()) as { items?: any[] };
  const emailItem = (emailListPayload.items || []).find((i) => i.to === emailTo);
  expect(emailItem, "Email outbox item should exist").toBeTruthy();
  expect(emailItem.providerMsgId, "Email providerMsgId should exist").toBeTruthy();

  const emailWebhook = await page.request.post("/api/public/email/webhook", {
    data: { providerMsgId: emailItem.providerMsgId, status: "delivered" },
    headers: WEBHOOK_SECRET ? { "x-webhook-key": WEBHOOK_SECRET } : undefined,
  });
  expect(emailWebhook.ok(), "Email webhook should succeed").toBeTruthy();

  const emailListAfter = await page.request.get(`/api/admin/email/outbox?to=${encodeURIComponent(emailTo)}`);
  const emailAfterPayload = (await emailListAfter.json()) as { items?: any[] };
  const emailAfter = (emailAfterPayload.items || []).find((i) => i.to === emailTo);
  expect(emailAfter?.status).toBe("DELIVERED");
});

