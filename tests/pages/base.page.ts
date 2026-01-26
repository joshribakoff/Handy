import { Page, Locator } from "@playwright/test";

export class BasePage {
  constructor(protected page: Page) {}

  async goto() {
    await this.page.goto("/");
  }

  async waitForApp() {
    await this.page.waitForLoadState("networkidle");
  }

  // Sidebar navigation - use role-based selector
  getSidebarItem(label: string): Locator {
    return this.page.getByRole("navigation").getByText(label);
  }

  async navigateTo(section: string) {
    await this.getSidebarItem(section).click();
  }

  // Toggle interactions - use switch role
  getToggle(label: string): Locator {
    return this.page.getByRole("switch", { name: new RegExp(label, "i") });
  }

  async clickToggle(label: string) {
    await this.getToggle(label).click();
  }

  async isToggleChecked(label: string): Promise<boolean> {
    return this.getToggle(label).isChecked();
  }

  // Dropdown interactions - use combobox role
  getDropdownTrigger(label: string): Locator {
    return this.page.getByRole("combobox", { name: new RegExp(label, "i") });
  }

  async openDropdown(label: string) {
    await this.getDropdownTrigger(label).click();
  }

  async selectDropdownOption(label: string, option: string) {
    await this.openDropdown(label);
    await this.page.getByRole("option", { name: option }).click();
  }

  async getSelectedDropdownValue(label: string): Promise<string> {
    const trigger = this.getDropdownTrigger(label);
    return (await trigger.textContent()) || "";
  }

  // Input interactions - use label association
  getInput(label: string): Locator {
    return this.page.getByLabel(new RegExp(label, "i"));
  }

  // Settings group visibility
  isSettingsGroupVisible(title: string): Promise<boolean> {
    return this.page.getByRole("region", { name: title }).isVisible();
  }
}
