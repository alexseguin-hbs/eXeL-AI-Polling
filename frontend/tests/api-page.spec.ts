import { test, expect } from "@playwright/test";

/**
 * API Page E2E Tests — Governance Engine API documentation.
 */

test.describe("API Page", () => {
  test("loads API documentation page", async ({ page }) => {
    await page.goto("/api");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(
      body?.includes("API") || body?.includes("Governance") || body?.includes("Engine")
    ).toBeTruthy();
  });
});
