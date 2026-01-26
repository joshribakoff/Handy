import { test, expect } from "@playwright/test";
import { AboutPage } from "../../pages/settings/about.page";
import { DebugPage } from "../../pages/settings/debug.page";

test.describe("About Settings", () => {
  let aboutPage: AboutPage;

  test.beforeEach(async ({ page }) => {
    aboutPage = new AboutPage(page);
    await aboutPage.navigate();
  });

  test("About section is visible in sidebar", async () => {
    await expect(aboutPage.isAboutSectionVisible()).toBeVisible();
  });

  test("displays About settings group title", async () => {
    await expect(aboutPage.getAboutTitle()).toBeVisible();
  });

  test("shows Application Language setting", async () => {
    await expect(aboutPage.getAppLanguageTitle()).toBeVisible();
  });

  test("shows version number", async () => {
    await expect(aboutPage.getVersionTitle()).toBeVisible();
    const versionText = await aboutPage.getVersionText();
    expect(versionText).toMatch(/^v\d+\.\d+\.\d+/);
  });

  test("shows Support Development section with Donate button", async () => {
    await expect(aboutPage.getSupportDevelopmentTitle()).toBeVisible();
    await expect(aboutPage.getDonateButton()).toBeVisible();
  });

  test("shows Source Code section with GitHub button", async () => {
    await expect(aboutPage.getSourceCodeTitle()).toBeVisible();
    await expect(aboutPage.getGitHubButton()).toBeVisible();
  });

  test("shows App Data Directory with path and Open button", async () => {
    await expect(aboutPage.getAppDataDirectoryTitle()).toBeVisible();
    // Path should contain platform-specific directory
    await expect(aboutPage.getAppDataPath()).toBeVisible();
    await expect(aboutPage.getAppDataOpenButton()).toBeVisible();
  });

  test("shows Log Directory with path and Open button", async () => {
    await expect(aboutPage.getLogDirectoryTitle()).toBeVisible();
    await expect(aboutPage.getLogDirectoryPath()).toBeVisible();
    await expect(aboutPage.getLogDirectoryOpenButton()).toBeVisible();
  });

  test("shows Acknowledgments section", async () => {
    await expect(aboutPage.getAcknowledgmentsTitle()).toBeVisible();
    await expect(aboutPage.getWhisperAcknowledgment()).toBeVisible();
  });
});

test.describe("Debug Settings", () => {
  let debugPage: DebugPage;

  test.beforeEach(async ({ page }) => {
    debugPage = new DebugPage(page);
    await debugPage.goto();
    await debugPage.waitForLoad();
  });

  test("Debug section is hidden by default (requires debug mode)", async () => {
    // Debug mode is disabled by default, so Debug should not be in sidebar
    await expect(debugPage.isDebugSectionVisible()).not.toBeVisible();
  });

  test.describe("with debug mode enabled", () => {
    test.beforeEach(async () => {
      await debugPage.enableDebugMode();
      // Wait for debug mode toggle to take effect
      await debugPage.page.waitForTimeout(500);
    });

    test("Debug section becomes visible after enabling debug mode", async () => {
      await expect(debugPage.isDebugSectionVisible()).toBeVisible();
    });

    test("shows Debug settings group when navigated", async () => {
      await debugPage.navigateTo("Debug");
      await expect(debugPage.getDebugTitle()).toBeVisible();
    });

    test("shows Log Level selector", async () => {
      await debugPage.navigateTo("Debug");
      await expect(debugPage.getLogLevelTitle()).toBeVisible();
      await expect(debugPage.getLogLevelDropdown()).toBeVisible();
    });

    test("Log Level dropdown shows available options", async () => {
      await debugPage.navigateTo("Debug");
      await debugPage.getLogLevelDropdown().click();
      // Check that log level options are available
      await expect(
        debugPage.page.getByRole("button", { name: "Error", exact: true })
      ).toBeVisible();
      await expect(
        debugPage.page.getByRole("button", { name: "Warn", exact: true })
      ).toBeVisible();
      await expect(
        debugPage.page.getByRole("button", { name: "Info", exact: true })
      ).toBeVisible();
      await expect(
        debugPage.page.getByRole("button", { name: "Debug", exact: true })
      ).toBeVisible();
      await expect(
        debugPage.page.getByRole("button", { name: "Trace", exact: true })
      ).toBeVisible();
    });

    test("shows Word Correction Threshold slider", async () => {
      await debugPage.navigateTo("Debug");
      await expect(debugPage.getWordCorrectionThresholdTitle()).toBeVisible();
      await expect(debugPage.getWordCorrectionSlider()).toBeVisible();
    });

    test("shows Sound Theme setting", async () => {
      await debugPage.navigateTo("Debug");
      await expect(debugPage.getSoundThemeTitle()).toBeVisible();
    });

    test("shows Check for Updates toggle", async () => {
      await debugPage.navigateTo("Debug");
      await expect(debugPage.getUpdateChecksTitle()).toBeVisible();
    });

    test("shows Always-On Microphone setting", async () => {
      await debugPage.navigateTo("Debug");
      await expect(debugPage.getAlwaysOnMicrophoneTitle()).toBeVisible();
    });

    test("shows Clamshell Microphone setting", async () => {
      await debugPage.navigateTo("Debug");
      await expect(debugPage.getClamshellMicrophoneTitle()).toBeVisible();
    });
  });
});
