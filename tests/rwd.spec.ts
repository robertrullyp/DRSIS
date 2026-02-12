import { test, expect, type Page } from "@playwright/test";

type ViewportCase = {
  name: string;
  width: number;
  height: number;
};

const viewportCases: ViewportCase[] = [
  { name: "mobile portrait", width: 390, height: 844 },
  { name: "mobile landscape", width: 844, height: 390 },
  { name: "tablet portrait", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
];

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@sis.local";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "admin123";

async function gotoStable(page: Page, path: string) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await page.goto(path, { waitUntil: "domcontentloaded", timeout: 60_000 });
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

async function assertNoHorizontalOverflow(page: Page) {
  const overflowX = await page.evaluate(() => {
    return document.documentElement.scrollWidth - window.innerWidth;
  });
  expect(overflowX, "Page should not overflow horizontally").toBeLessThanOrEqual(2);
}

async function loginAsAdmin(page: Page) {
  let authenticated = await signInViaNextAuthApi(page);
  for (let attempt = 1; attempt <= 3 && !authenticated; attempt += 1) {
    await gotoStable(page, "/sign-in?callbackUrl=/dashboard");
    await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
    await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);

    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForTimeout(1_000);
    const hasSession = await waitForSession(page, 10_000);
    if (hasSession) {
      authenticated = true;
      break;
    }

    await page.waitForTimeout(1_000);
  }
  expect(authenticated, "Admin sign-in should succeed within retry window").toBeTruthy();

  await gotoStable(page, "/dashboard");
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible({ timeout: 30_000 });
}

test.describe.configure({ timeout: 480_000 });

test("RWD public landing works across viewport targets", async ({ page }) => {
  for (const viewport of viewportCases) {
    await test.step(viewport.name, async () => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await gotoStable(page, "/");
      await expect(page.locator("main h1").first()).toBeVisible();
      await expect(page.getByRole("link", { name: /Masuk Dashboard/i })).toBeVisible();
      await assertNoHorizontalOverflow(page);
    });
  }
});

test("RWD dashboard navigation works on mobile/tablet/desktop", async ({ page }) => {
  await loginAsAdmin(page);
  await gotoStable(page, "/dashboard");

  for (const viewport of viewportCases) {
    await test.step(viewport.name, async () => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await gotoStable(page, "/dashboard");
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
      await expect(page.getByText("Campus Command Center")).toBeVisible({
        timeout: 20_000,
      });
      await assertNoHorizontalOverflow(page);

      if (viewport.width < 1024) {
        const mobileMenuButton = page
          .locator('button[aria-label="Buka menu"], button[aria-label="Tutup menu"]')
          .first();
        await expect(mobileMenuButton).toBeVisible({ timeout: 10_000 });
        let menuOpened = false;
        const menuAriaLabel = await mobileMenuButton
          .getAttribute("aria-label")
          .catch(() => null);
        if (menuAriaLabel === "Tutup menu") {
          menuOpened = true;
        }

        for (let attempt = 1; attempt <= 2 && !menuOpened; attempt += 1) {
          await mobileMenuButton.click({ force: true });
          await page.waitForTimeout(300);

          const closeButtonVisible = await page.getByRole("button", { name: /Tutup menu/i }).first().isVisible().catch(() => false);
          if (closeButtonVisible) {
            menuOpened = true;
            break;
          }

          const sidebar = page.locator("aside").first();
          const sidebarRightEdge = await sidebar.evaluate((element) => {
            const rect = element.getBoundingClientRect();
            return rect.x + rect.width;
          });
          if (sidebarRightEdge > 0) {
            menuOpened = true;
            break;
          }
        }

        expect(menuOpened, "Sidebar should open after tapping mobile menu button").toBeTruthy();

        const closeButton = page.getByRole("button", { name: /Tutup menu/i }).first();
        if (await closeButton.isVisible().catch(() => false)) {
          await closeButton.click({ force: true });
        }

        await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
      }
    });
  }
});
