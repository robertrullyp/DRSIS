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

async function assertNoHorizontalOverflow(page: Page) {
  const overflowX = await page.evaluate(() => {
    return document.documentElement.scrollWidth - window.innerWidth;
  });
  expect(overflowX, "Page should not overflow horizontally").toBeLessThanOrEqual(2);
}

async function loginAsAdmin(page: Page) {
  await gotoStable(page, "/sign-in?callbackUrl=/dashboard");
  await page.locator('input[type="email"]').fill("admin@sis.local");
  await page.locator('input[type="password"]').fill("admin123");
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/auth/callback/credentials"), { timeout: 120_000 }),
    page.getByRole("button", { name: /sign in/i }).click(),
  ]);
  await gotoStable(page, "/dashboard");
  await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible();
}

test.describe.configure({ timeout: 240_000 });

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

  for (const viewport of viewportCases) {
    await test.step(viewport.name, async () => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await gotoStable(page, "/dashboard");
      await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible();
      await assertNoHorizontalOverflow(page);

      if (viewport.width < 1024) {
        const openMenuButton = page.getByRole("button", { name: /Buka menu/i });
        await expect(openMenuButton).toBeVisible();
        await openMenuButton.click();
        await expect(page.getByRole("button", { name: /Tutup menu/i })).toBeVisible();
      }
    });
  }
});
