import { Page, Locator } from "@playwright/test";

/**
 * Base page object class with common utilities.
 */
export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to app root.
   */
  async goto(): Promise<void> {
    await this.page.goto("/");
  }

  /**
   * Wait for page to be fully loaded.
   */
  async waitForReady(): Promise<void> {
    await this.page.waitForLoadState("domcontentloaded");
  }

  /**
   * Get element by text content.
   */
  getByText(text: string): Locator {
    return this.page.getByText(text);
  }

  /**
   * Get element by test ID.
   */
  getByTestId(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  /**
   * Get element by role.
   */
  getByRole(
    role: Parameters<Page["getByRole"]>[0],
    options?: Parameters<Page["getByRole"]>[1],
  ): Locator {
    return this.page.getByRole(role, options);
  }

  /**
   * Check if element is visible.
   */
  async isVisible(locator: Locator): Promise<boolean> {
    return locator.isVisible();
  }
}
