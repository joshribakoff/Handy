import { Page, Locator, expect } from "@playwright/test";

export class BasePage {
  constructor(protected page: Page) {}

  async goto() {
    await this.page.goto("/");
  }

  async waitForApp() {
    await this.page.waitForLoadState("networkidle");
  }

  // Sidebar navigation
  getSidebarItem(label: string): Locator {
    return this.page.locator(".flex.flex-col.w-40").getByText(label);
  }

  async navigateTo(section: string) {
    await this.getSidebarItem(section).click();
  }

  // Common UI interactions
  async clickToggle(label: string) {
    const container = this.page.locator("h3", { hasText: label }).locator("..");
    const toggle = container.locator('input[type="checkbox"]');
    await toggle.click({ force: true });
  }

  async isToggleChecked(label: string): Promise<boolean> {
    const container = this.page.locator("h3", { hasText: label }).locator("..");
    const toggle = container.locator('input[type="checkbox"]');
    return toggle.isChecked();
  }

  getToggle(label: string): Locator {
    return this.page
      .locator("h3", { hasText: label })
      .locator("..")
      .locator('input[type="checkbox"]');
  }

  // Dropdown interactions
  getDropdownTrigger(label: string): Locator {
    return this.page
      .locator("h3", { hasText: label })
      .locator("..")
      .locator("button");
  }

  async openDropdown(label: string) {
    await this.getDropdownTrigger(label).click();
  }

  async selectDropdownOption(label: string, option: string) {
    await this.openDropdown(label);
    await this.page
      .locator(".absolute.top-full button", { hasText: option })
      .click();
  }

  async getSelectedDropdownValue(label: string): Promise<string> {
    const trigger = this.getDropdownTrigger(label);
    return (await trigger.locator("span").first().textContent()) || "";
  }

  // Input interactions
  getInput(label: string): Locator {
    return this.page
      .locator("h3", { hasText: label })
      .locator("..")
      .locator("input");
  }
}
