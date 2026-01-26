import { type Page, type Locator } from "@playwright/test";
import { getTauriMockScript, TauriMockConfig } from "../fixtures/tauri-mock";

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  async goto(config: TauriMockConfig = { hasModels: true }): Promise<void> {
    await this.page.addInitScript(getTauriMockScript(config));
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

  /** Wait for the main app to load */
  async waitForApp(): Promise<void> {
    await this.page
      .getByText("General", { exact: true })
      .first()
      .waitFor({ state: "visible", timeout: 10000 });
  }

  /** Get a toggle switch by label */
  getToggle(label: string): Locator {
    return this.page.getByRole("switch", { name: new RegExp(label, "i") });
  }

  /** Get a dropdown trigger by label */
  getDropdownTrigger(label: string): Locator {
    return this.page
      .locator("div")
      .filter({ has: this.page.getByText(label, { exact: false }) })
      .getByRole("combobox")
      .or(this.page.getByRole("combobox", { name: new RegExp(label, "i") }));
  }
}
