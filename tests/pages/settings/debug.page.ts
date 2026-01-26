import { type Page, type Locator } from "@playwright/test";
import { BasePage } from "../base.page";

export class DebugPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /** Navigate to Debug section (requires debug mode enabled) */
  async navigate(): Promise<void> {
    await this.goto();
    await this.waitForLoad();
    await this.navigateTo("Debug");
  }

  /** Enable debug mode via keyboard shortcut */
  async enableDebugMode(): Promise<void> {
    const modifier = process.platform === "darwin" ? "Meta" : "Control";
    await this.page.keyboard.press(`${modifier}+Shift+D`);
  }

  /** Get the Debug settings group title */
  getDebugTitle(): Locator {
    return this.getSettingsGroup("Debug");
  }

  /** Get Log Level setting title */
  getLogLevelTitle(): Locator {
    return this.getSettingByTitle("Log Level");
  }

  /** Get Log Level dropdown */
  getLogLevelDropdown(): Locator {
    return this.page
      .locator("h3:has-text('Log Level')")
      .locator("..")
      .locator("..")
      .locator("button");
  }

  /** Get the currently selected log level value */
  async getSelectedLogLevel(): Promise<string> {
    const dropdown = this.getLogLevelDropdown();
    return (await dropdown.textContent()) ?? "";
  }

  /** Select a log level from the dropdown */
  async selectLogLevel(level: string): Promise<void> {
    await this.getLogLevelDropdown().click();
    await this.page.getByRole("button", { name: level, exact: true }).click();
  }

  /** Get Word Correction Threshold setting */
  getWordCorrectionThresholdTitle(): Locator {
    return this.getSettingByTitle("Word Correction Threshold");
  }

  /** Get the word correction threshold slider */
  getWordCorrectionSlider(): Locator {
    return this.page.locator('input[type="range"]').first();
  }

  /** Get the word correction threshold value display */
  async getWordCorrectionValue(): Promise<string> {
    return (
      (await this.page
        .locator("h3:has-text('Word Correction Threshold')")
        .locator("..")
        .locator("..")
        .locator("span.text-sm.font-medium")
        .textContent()) ?? ""
    );
  }

  /** Get Sound Theme setting */
  getSoundThemeTitle(): Locator {
    return this.getSettingByTitle("Sound Theme");
  }

  /** Get Check for Updates toggle */
  getUpdateChecksTitle(): Locator {
    return this.getSettingByTitle("Check for Updates");
  }

  /** Get Always-On Microphone setting */
  getAlwaysOnMicrophoneTitle(): Locator {
    return this.getSettingByTitle("Always-On Microphone");
  }

  /** Get Clamshell Microphone setting */
  getClamshellMicrophoneTitle(): Locator {
    return this.getSettingByTitle("Clamshell Microphone");
  }

  /** Check if Debug section is visible in sidebar */
  isDebugSectionVisible(): Locator {
    return this.getSidebarItem("Debug");
  }
}
