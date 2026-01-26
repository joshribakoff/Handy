import { type Page, type Locator } from "@playwright/test";

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/");
  }

  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState("domcontentloaded");
  }

  /** Click a sidebar navigation item by its text label */
  async navigateTo(section: string): Promise<void> {
    await this.page.locator(`text=${section}`).click();
  }

  /** Get the active sidebar section */
  getSidebarItem(label: string): Locator {
    return this.page.locator(".flex.flex-col.w-full").getByText(label);
  }

  /** Check if a settings group with the given title exists */
  getSettingsGroup(title: string): Locator {
    return this.page.locator(`text=${title}`).first();
  }

  /** Get a setting container by its title */
  getSettingByTitle(title: string): Locator {
    return this.page.locator(`h3:has-text("${title}")`).first();
  }

  /** Get a dropdown button */
  getDropdown(): Locator {
    return this.page.locator("button").filter({ has: this.page.locator("svg") });
  }

  /** Get a button by its text */
  getButton(text: string): Locator {
    return this.page.getByRole("button", { name: text });
  }
}
