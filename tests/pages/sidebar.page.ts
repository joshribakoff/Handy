import { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page";

export class SidebarPage extends BasePage {
  readonly sidebar: Locator;
  readonly generalSection: Locator;
  readonly advancedSection: Locator;
  readonly historySection: Locator;
  readonly aboutSection: Locator;

  constructor(page: Page) {
    super(page);
    this.sidebar = page.locator('[class*="border-r"]').first();
    this.generalSection = page.getByText("General").first();
    this.advancedSection = page.getByText("Advanced").first();
    this.historySection = page.getByText("History").first();
    this.aboutSection = page.getByText("About").first();
  }

  async navigateToHistory(): Promise<void> {
    await this.historySection.click();
  }

  async navigateToGeneral(): Promise<void> {
    await this.generalSection.click();
  }

  async navigateToAdvanced(): Promise<void> {
    await this.advancedSection.click();
  }

  async navigateToAbout(): Promise<void> {
    await this.aboutSection.click();
  }
}
