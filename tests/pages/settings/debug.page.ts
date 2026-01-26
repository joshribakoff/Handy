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
    await this.enableDebugMode();
    await this.page.waitForTimeout(500);
    await this.navigateTo("Debug");
  }

  /** Get Debug section in sidebar */
  getDebugSidebarItem(): Locator {
    return this.getSidebarItem("Debug");
  }

  /** Get the Log Level combobox/dropdown */
  getLogLevelDropdown(): Locator {
    return this.page.getByRole("combobox", { name: /log level/i });
  }

  /** Get a log level option by name */
  getLogLevelOption(level: string): Locator {
    return this.page.getByRole("option", { name: level });
  }

  /** Select a log level */
  async selectLogLevel(level: string): Promise<void> {
    await this.getLogLevelDropdown().click();
    await this.getLogLevelOption(level).click();
  }

  /** Get word correction threshold slider */
  getWordCorrectionSlider(): Locator {
    return this.page.getByRole("slider", { name: /word correction/i });
  }
}
