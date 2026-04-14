import { test, expect } from "@playwright/test";

/**
 * Dashboard E2E Tests — CRS-06: Moderator dashboard.
 *
 * Tests the moderator's view: session list, session creation,
 * and basic navigation. Auth0 login is not tested here (requires
 * real credentials) — these test the UI structure.
 */

test.describe("Dashboard", () => {
  test("loads dashboard page", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    // Dashboard should load (may redirect to login or show session list)
    const url = page.url();
    expect(url).toContain("/dashboard");
  });

  test("shows session list or login prompt", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    // Should show either sessions or a login button
    expect(
      body?.includes("Session") ||
      body?.includes("session") ||
      body?.includes("Login") ||
      body?.includes("Sign") ||
      body?.includes("Create")
    ).toBeTruthy();
  });
});
