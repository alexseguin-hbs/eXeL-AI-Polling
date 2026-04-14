import { test, expect } from "@playwright/test";

/**
 * Homepage E2E Tests — CRS-01: Landing page + session code entry.
 *
 * Tests the first thing every user sees: the homepage with
 * SoI Trinity feature cards and session code input.
 */

test.describe("Homepage", () => {
  test("loads and shows title", async ({ page }) => {
    await page.goto("/");
    // Page should load without errors
    await expect(page).toHaveTitle(/eXeL/i);
  });

  test("shows session code input", async ({ page }) => {
    await page.goto("/");
    // Session code input should be visible for users to join
    const input = page.locator('input[placeholder*="code" i], input[placeholder*="session" i], input[type="text"]').first();
    await expect(input).toBeVisible({ timeout: 10_000 });
  });

  test("shows SoI Trinity feature cards", async ({ page }) => {
    await page.goto("/");
    // Three feature cards: AI Theming, Scale to Millions, Human Governance
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    // At least one Trinity concept should be visible
    expect(
      body?.includes("AI") || body?.includes("Scale") || body?.includes("Governance")
    ).toBeTruthy();
  });

  test("has navigation bar", async ({ page }) => {
    await page.goto("/");
    // Navbar with language selector should exist
    const nav = page.locator("nav").first();
    await expect(nav).toBeVisible({ timeout: 10_000 });
  });

  test("powered badge visible", async ({ page }) => {
    await page.goto("/");
    // eXeL powered badge should be at the bottom
    await page.waitForLoadState("networkidle");
    const badge = page.locator('text=/eXeL/i').first();
    await expect(badge).toBeVisible({ timeout: 10_000 });
  });
});
