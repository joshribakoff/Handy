import { type Page, type Locator } from "@playwright/test";
import { BasePage } from "../base.page";

export class AboutPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /** Navigate to About section */
  async navigate(): Promise<void> {
    await this.goto();
    await this.waitForLoad();
    await this.navigateTo("About");
  }

  /** Get the About section in sidebar */
  getAboutSidebarItem(): Locator {
    return this.getSidebarItem("About");
  }

  /** Get version text display */
  getVersionText(): Locator {
    return this.page.getByText(/^v\d+\.\d+\.\d+/);
  }

  /** Get Donate button */
  getDonateButton(): Locator {
    return this.getButton("Donate");
  }

  /** Get View on GitHub link/button */
  getGitHubButton(): Locator {
    return this.getButton("View on GitHub");
  }

  /** Get Open button for App Data Directory */
  getAppDataOpenButton(): Locator {
    return this.page
      .getByText("App Data Directory")
      .locator("../..")
      .getByRole("button", { name: "Open" });
  }

  /** Get Open button for Log Directory */
  getLogDirectoryOpenButton(): Locator {
    return this.page
      .getByText("Log Directory")
      .locator("../..")
      .getByRole("button", { name: "Open" });
  }
}
