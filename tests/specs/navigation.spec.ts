import { test, expect } from "../fixtures/app.fixture";
import {
  SidebarPage,
  SECTION_LABELS,
  ALWAYS_VISIBLE_SECTIONS,
} from "../pages/sidebar.page";
import { getTauriMockScript } from "../fixtures/tauri-mock";

test.describe("Sidebar Navigation", () => {
  test("sidebar renders with always-visible sections", async ({ sidebar }) => {
    // Always-visible: General, Advanced, History, About
    for (const section of ALWAYS_VISIBLE_SECTIONS) {
      await expect(sidebar.getSection(section)).toBeVisible();
    }
  });

  test("clicking section switches the active view", async ({ page, sidebar }) => {
    // Start at General (default)
    await expect(sidebar.getSection("general")).toBeVisible();

    // Click Advanced
    await sidebar.clickSection("advanced");
    expect(await sidebar.isSectionActive("advanced")).toBe(true);
    // Verify Advanced settings content is shown
    await expect(page.getByText("Output")).toBeVisible();

    // Click History
    await sidebar.clickSection("history");
    expect(await sidebar.isSectionActive("history")).toBe(true);
    // Verify History content is shown
    await expect(page.getByText("Open Recordings Folder")).toBeVisible();

    // Click About
    await sidebar.clickSection("about");
    expect(await sidebar.isSectionActive("about")).toBe(true);
    // Verify About content is shown
    await expect(page.getByText("Version")).toBeVisible();

    // Click back to General
    await sidebar.clickSection("general");
    expect(await sidebar.isSectionActive("general")).toBe(true);
  });

  test("active section is highlighted", async ({ sidebar }) => {
    // General should be active by default
    expect(await sidebar.isSectionActive("general")).toBe(true);
    expect(await sidebar.isSectionActive("advanced")).toBe(false);

    // Switch to Advanced
    await sidebar.clickSection("advanced");
    expect(await sidebar.isSectionActive("advanced")).toBe(true);
    expect(await sidebar.isSectionActive("general")).toBe(false);
  });

  test("sidebar logo is visible", async ({ sidebar }) => {
    await expect(sidebar.logo).toBeVisible();
  });

  test("section labels match expected text", async ({ sidebar }) => {
    const labels = await sidebar.getVisibleSectionLabels();

    // Check always-visible sections are present
    for (const section of ALWAYS_VISIBLE_SECTIONS) {
      expect(labels).toContain(SECTION_LABELS[section]);
    }
  });
});

test.describe("Footer", () => {
  test("footer is visible with model selector", async ({ page }) => {
    // Inject mocks and navigate
    await page.addInitScript(getTauriMockScript({ hasModels: true }));
    await page.goto("/");

    // Footer should have border-t class
    const footer = page.locator("div.border-t").first();
    await expect(footer).toBeVisible({ timeout: 10000 });

    // Model selector button should be visible
    const modelButton = footer.locator("button").first();
    await expect(modelButton).toBeVisible();
  });

  test("version is displayed in footer", async ({ page }) => {
    await page.addInitScript(getTauriMockScript({ hasModels: true }));
    await page.goto("/");

    // Version format: v0.x.x
    await expect(page.getByText(/v\d+\.\d+/)).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Conditional Sections", () => {
  test("debug section visible when debug_mode enabled", async ({ page }) => {
    // Enable debug mode via mock
    await page.addInitScript(getTauriMockScript({ hasModels: true, debugMode: true }));
    await page.goto("/");

    const sidebar = new SidebarPage(page);
    await expect(sidebar.container).toBeVisible({ timeout: 10000 });

    // Debug section should be visible
    await expect(sidebar.getSection("debug")).toBeVisible();

    // Click debug section
    await sidebar.clickSection("debug");
    expect(await sidebar.isSectionActive("debug")).toBe(true);

    // Verify Debug content is shown
    await expect(page.getByText("Log Directory")).toBeVisible();
  });

  test("post-processing section visible when enabled", async ({ page }) => {
    // Enable post-processing via mock
    await page.addInitScript(
      getTauriMockScript({ hasModels: true, postProcessEnabled: true })
    );
    await page.goto("/");

    const sidebar = new SidebarPage(page);
    await expect(sidebar.container).toBeVisible({ timeout: 10000 });

    // Post-processing section should be visible
    await expect(sidebar.getSection("postprocessing")).toBeVisible();

    // Click post-processing section
    await sidebar.clickSection("postprocessing");
    expect(await sidebar.isSectionActive("postprocessing")).toBe(true);
  });

  test("all 6 sections visible with all features enabled", async ({ page }) => {
    // Enable all conditional features
    await page.addInitScript(
      getTauriMockScript({ hasModels: true, debugMode: true, postProcessEnabled: true })
    );
    await page.goto("/");

    const sidebar = new SidebarPage(page);
    await expect(sidebar.container).toBeVisible({ timeout: 10000 });

    // All 6 sections should be visible
    const count = await sidebar.getVisibleSectionCount();
    expect(count).toBe(6);

    // Verify each section
    await expect(sidebar.getSection("general")).toBeVisible();
    await expect(sidebar.getSection("advanced")).toBeVisible();
    await expect(sidebar.getSection("postprocessing")).toBeVisible();
    await expect(sidebar.getSection("history")).toBeVisible();
    await expect(sidebar.getSection("debug")).toBeVisible();
    await expect(sidebar.getSection("about")).toBeVisible();
  });
});
