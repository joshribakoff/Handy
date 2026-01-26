import { type Page, type Locator } from "@playwright/test";
import { BasePage } from "../base.page";

export class AboutPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /** Navigate to About section */
  async navigate(): Promise<void> {
    await this.goto();
    await this.waitForLoad();
    await this.navigateTo("About");
  }

  /** Get the About settings group title */
  getAboutTitle(): Locator {
    return this.getSettingsGroup("About");
  }

  /** Get Application Language setting */
  getAppLanguageTitle(): Locator {
    return this.getSettingByTitle("Application Language");
  }

  /** Get Version setting title */
  getVersionTitle(): Locator {
    return this.getSettingByTitle("Version");
  }

  /** Get the version number display */
  getVersionNumber(): Locator {
    return this.page.locator("span.font-mono").filter({ hasText: /^v\d/ });
  }

  /** Get the version string text */
  async getVersionText(): Promise<string> {
    return (await this.getVersionNumber().textContent()) ?? "";
  }

  /** Get Support Development setting */
  getSupportDevelopmentTitle(): Locator {
    return this.getSettingByTitle("Support Development");
  }

  /** Get Donate button */
  getDonateButton(): Locator {
    return this.getButton("Donate");
  }

  /** Get Source Code setting */
  getSourceCodeTitle(): Locator {
    return this.getSettingByTitle("Source Code");
  }

  /** Get View on GitHub button */
  getGitHubButton(): Locator {
    return this.getButton("View on GitHub");
  }

  /** Get App Data Directory setting */
  getAppDataDirectoryTitle(): Locator {
    return this.getSettingByTitle("App Data Directory");
  }

  /** Get the app data directory path display */
  getAppDataPath(): Locator {
    return this.page
      .locator("h3:has-text('App Data Directory')")
      .locator("..")
      .locator("..")
      .locator(".font-mono");
  }

  /** Get the app data directory Open button */
  getAppDataOpenButton(): Locator {
    return this.page
      .locator("h3:has-text('App Data Directory')")
      .locator("..")
      .locator("..")
      .getByRole("button", { name: "Open" });
  }

  /** Get Log Directory setting */
  getLogDirectoryTitle(): Locator {
    return this.getSettingByTitle("Log Directory");
  }

  /** Get the log directory path display */
  getLogDirectoryPath(): Locator {
    return this.page
      .locator("h3:has-text('Log Directory')")
      .locator("..")
      .locator("..")
      .locator(".font-mono");
  }

  /** Get the log directory Open button */
  getLogDirectoryOpenButton(): Locator {
    return this.page
      .locator("h3:has-text('Log Directory')")
      .locator("..")
      .locator("..")
      .getByRole("button", { name: "Open" });
  }

  /** Get Acknowledgments section title */
  getAcknowledgmentsTitle(): Locator {
    return this.getSettingsGroup("Acknowledgments");
  }

  /** Get Whisper.cpp acknowledgment */
  getWhisperAcknowledgment(): Locator {
    return this.getSettingByTitle("Whisper.cpp");
  }

  /** Check if About section is visible in sidebar */
  isAboutSectionVisible(): Locator {
    return this.getSidebarItem("About");
  }
}
