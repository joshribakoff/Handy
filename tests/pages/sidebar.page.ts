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
    this.sidebar = page.getByRole("navigation");
    this.generalSection = page.getByRole("button", { name: /general/i });
    this.advancedSection = page.getByRole("button", { name: /advanced/i });
    this.historySection = page.getByRole("button", { name: /history/i });
    this.aboutSection = page.getByRole("button", { name: /about/i });
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
