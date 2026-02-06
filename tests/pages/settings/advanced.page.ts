import { Page, Locator } from "@playwright/test";
import { BasePage } from "../base.page";

export class AdvancedSettingsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async navigate() {
    await this.goto();
    await this.waitForApp();
    await this.navigateTo("Advanced");
  }

  // App Settings - toggles use inherited semantic methods
  get startHiddenToggle(): Locator {
    return this.getToggle("Start Hidden");
  }

  get autostartToggle(): Locator {
    return this.getToggle("Launch on Startup");
  }

  get experimentalToggle(): Locator {
    return this.getToggle("Experimental Features");
  }

  // App Settings - dropdowns use inherited semantic methods
  get overlayDropdown(): Locator {
    return this.getDropdownTrigger("Overlay Position");
  }

  get modelUnloadDropdown(): Locator {
    return this.getDropdownTrigger("Unload Model");
  }

  // Output Settings
  get pasteMethodDropdown(): Locator {
    return this.getDropdownTrigger("Paste Method");
  }

  get clipboardHandlingDropdown(): Locator {
    return this.getDropdownTrigger("Clipboard Handling");
  }

  // Transcription Settings
  get translateToggle(): Locator {
    return this.getToggle("Translate to English");
  }

  get trailingSpaceToggle(): Locator {
    return this.getToggle("Append Trailing Space");
  }

  get customWordsInput(): Locator {
    return this.page.getByLabel(/custom words/i);
  }

  get addWordButton(): Locator {
    return this.page.getByRole("button", { name: /add/i });
  }

  async addCustomWord(word: string) {
    await this.customWordsInput.fill(word);
    await this.addWordButton.click();
  }

  getCustomWordChip(word: string): Locator {
    return this.page.getByRole("button", {
      name: new RegExp(`remove ${word}`, "i"),
    });
  }

  async removeCustomWord(word: string) {
    await this.getCustomWordChip(word).click();
  }

  // History Settings
  get historyLimitInput(): Locator {
    return this.page.getByLabel(/history limit/i);
  }

  async setHistoryLimit(value: number) {
    await this.historyLimitInput.fill(value.toString());
  }

  async getHistoryLimit(): Promise<number> {
    const value = await this.historyLimitInput.inputValue();
    return parseInt(value, 10);
  }
}
