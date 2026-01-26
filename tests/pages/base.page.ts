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
    await this.page.getByRole("navigation").getByText(section).click();
  }

  /** Get the sidebar navigation item */
  getSidebarItem(label: string): Locator {
    return this.page.getByRole("navigation").getByText(label);
  }

  /** Get a heading by text */
  getHeading(text: string): Locator {
    return this.page.getByRole("heading", { name: text });
  }

  /** Get a button by its accessible name */
  getButton(name: string): Locator {
    return this.page.getByRole("button", { name });
  }

  /** Get a link by its accessible name */
  getLink(name: string): Locator {
    return this.page.getByRole("link", { name });
  }

  /** Enable debug mode via keyboard shortcut */
  async enableDebugMode(): Promise<void> {
    const modifier = process.platform === "darwin" ? "Meta" : "Control";
    await this.page.keyboard.press(`${modifier}+Shift+D`);
  }
}
