import { test, expect } from "../fixtures/app.fixture";
import {
  SidebarPage,
  SECTION_LABELS,
  ALWAYS_VISIBLE_SECTIONS,
} from "../pages/sidebar.page";
import { getTauriMockScript } from "../fixtures/tauri-mock";

test.describe("Sidebar Navigation", () => {
  test("sidebar renders with always-visible sections", async ({
    sidebar,
    page,
  }) => {
    // Always-visible: General, Advanced, History, About
    for (const section of ALWAYS_VISIBLE_SECTIONS) {
      await expect(
        page.getByText(SECTION_LABELS[section], { exact: true }).first(),
      ).toBeVisible();
    }
  });

  test("clicking section switches the active view", async ({
    sidebar,
    page,
  }) => {
    // Click Advanced
    await page.getByText("Advanced", { exact: true }).first().click();
    // Verify Advanced settings content is shown
    await expect(page.getByText("Output")).toBeVisible();

    // Click History
    await page.getByText("History", { exact: true }).first().click();
    // Verify History content is shown
    await expect(page.getByText("Open Recordings Folder")).toBeVisible();

    // Click About
    await page.getByText("About", { exact: true }).first().click();
    // Verify About content is shown
    await expect(page.getByText("Version")).toBeVisible();

    // Click back to General
    await page.getByText("General", { exact: true }).first().click();
    // General is the default view, verify it loaded
    await expect(
      page.getByText("General", { exact: true }).first(),
    ).toBeVisible();
  });

  test("section labels match expected text", async ({ sidebar, page }) => {
    // Check always-visible sections are present with correct labels
    for (const section of ALWAYS_VISIBLE_SECTIONS) {
      await expect(
        page.getByText(SECTION_LABELS[section], { exact: true }).first(),
      ).toBeVisible();
    }
  });
});

test.describe("Footer", () => {
  test("version is displayed", async ({ page }) => {
    await page.addInitScript(getTauriMockScript({ hasModels: true }));
    await page.goto("/");

    // Version format: v0.x.x
    await expect(page.getByText(/v\d+\.\d+/)).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Conditional Sections", () => {
  test("debug section visible when debug_mode enabled", async ({ page }) => {
    // Enable debug mode via mock
    await page.addInitScript(
      getTauriMockScript({ hasModels: true, debugMode: true }),
    );
    await page.goto("/");

    // Wait for sidebar to load
    await page
      .getByText("General", { exact: true })
      .first()
      .waitFor({ state: "visible", timeout: 10000 });

    // Debug section should be visible
    await expect(
      page.getByText("Debug", { exact: true }).first(),
    ).toBeVisible();

    // Click debug section
    await page.getByText("Debug", { exact: true }).first().click();

    // Verify Debug content is shown
    await expect(page.getByText("Log Level")).toBeVisible();
  });

  test("post-processing section visible when enabled", async ({ page }) => {
    // Enable post-processing via mock
    await page.addInitScript(
      getTauriMockScript({ hasModels: true, postProcessEnabled: true }),
    );
    await page.goto("/");

    // Wait for sidebar to load
    await page
      .getByText("General", { exact: true })
      .first()
      .waitFor({ state: "visible", timeout: 10000 });

    // Post-processing section should be visible
    await expect(
      page.getByText("Post Process", { exact: true }).first(),
    ).toBeVisible();

    // Click post-processing section
    await page.getByText("Post Process", { exact: true }).first().click();
  });

  test("all 6 sections visible with all features enabled", async ({ page }) => {
    // Enable all conditional features
    await page.addInitScript(
      getTauriMockScript({
        hasModels: true,
        debugMode: true,
        postProcessEnabled: true,
      }),
    );
    await page.goto("/");

    // Wait for sidebar to load
    await page
      .getByText("General", { exact: true })
      .first()
      .waitFor({ state: "visible", timeout: 10000 });

    // Verify each section is visible
    await expect(
      page.getByText("General", { exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByText("Advanced", { exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByText("Post Process", { exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByText("History", { exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByText("Debug", { exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByText("About", { exact: true }).first(),
    ).toBeVisible();
  });
});
