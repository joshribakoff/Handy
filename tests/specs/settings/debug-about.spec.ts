import { test, expect } from "@playwright/test";
import { AboutPage } from "../../pages/settings/about.page";
import { DebugPage } from "../../pages/settings/debug.page";

test.describe("About Settings", () => {
  test("displays app info and action buttons", async ({ page }) => {
    const aboutPage = new AboutPage(page);
    await aboutPage.navigate();

    // Key info is present
    await expect(aboutPage.getVersionText()).toBeVisible();
    await expect(aboutPage.getDonateButton()).toBeVisible();
    await expect(aboutPage.getGitHubButton()).toBeVisible();
    await expect(aboutPage.getAppDataOpenButton()).toBeVisible();
    await expect(aboutPage.getLogDirectoryOpenButton()).toBeVisible();
  });
});

test.describe("Debug Settings", () => {
  test("debug section requires debug mode", async ({ page }) => {
    const debugPage = new DebugPage(page);
    await debugPage.goto();
    await debugPage.waitForLoad();

    // Debug not visible by default
    await expect(debugPage.getDebugSidebarItem()).not.toBeVisible();

    // Enable debug mode
    await debugPage.enableDebugMode();
    await page.waitForTimeout(500);

    // Debug section now visible
    await expect(debugPage.getDebugSidebarItem()).toBeVisible();
  });

  test("can change log level", async ({ page }) => {
    const debugPage = new DebugPage(page);
    await debugPage.navigate();

    // Open dropdown and select Debug level
    await debugPage.getLogLevelDropdown().click();
    await expect(
      page.getByRole("option", { name: "Debug", exact: true }),
    ).toBeVisible();
  });
});
