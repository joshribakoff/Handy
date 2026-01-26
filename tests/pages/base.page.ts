import { Page, Locator } from "@playwright/test";

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.goto("/");
  }

  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState("networkidle");
  }
}
