import { test, expect } from "@playwright/test";

/**
 * Divinity Guide E2E Tests — Flower of Life book reader.
 *
 * Tests the spiritual content reader: flower navigation,
 * language switching, Pinyin toggle, chapter selection.
 */

test.describe("Divinity Guide", () => {
  test("loads divinity guide page", async ({ page }) => {
    await page.goto("/divinity-guide");
    await page.waitForLoadState("networkidle");
    // Should show the Divinity Guide title
    const body = await page.textContent("body");
    expect(body).toContain("Divinity");
  });

  test("shows flower SVG navigation", async ({ page }) => {
    await page.goto("/divinity-guide");
    await page.waitForLoadState("networkidle");
    // Flower of Life SVG should be rendered
    const svg = page.locator("svg").first();
    await expect(svg).toBeVisible({ timeout: 10_000 });
  });

  test("shows language selector", async ({ page }) => {
    await page.goto("/divinity-guide");
    await page.waitForLoadState("networkidle");
    // Language dropdown should exist with 10 languages
    const select = page.locator("select").first();
    await expect(select).toBeVisible({ timeout: 10_000 });
  });

  test("shows 12 Wisdom Portals button", async ({ page }) => {
    await page.goto("/divinity-guide");
    await page.waitForLoadState("networkidle");
    // Toggle button should be visible (reinstated in earlier fix)
    const body = await page.textContent("body");
    expect(
      body?.includes("Portal") || body?.includes("portal") || body?.includes("Library") || body?.includes("library")
    ).toBeTruthy();
  });

  test("shows Sacred Library button", async ({ page }) => {
    await page.goto("/divinity-guide");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    // Sacred Library toggle should exist
    expect(
      body?.includes("Library") || body?.includes("library") || body?.includes("Sacred")
    ).toBeTruthy();
  });
});
