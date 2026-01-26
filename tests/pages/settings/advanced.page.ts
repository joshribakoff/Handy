import { Page, Locator, expect } from "@playwright/test";
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

  // App Settings Group
  get startHiddenToggle(): Locator {
    return this.getToggle("Start Hidden");
  }

  async toggleStartHidden() {
    await this.clickToggle("Start Hidden");
  }

  async isStartHiddenEnabled(): Promise<boolean> {
    return this.isToggleChecked("Start Hidden");
  }

  get autostartToggle(): Locator {
    return this.getToggle("Launch on Startup");
  }

  async toggleAutostart() {
    await this.clickToggle("Launch on Startup");
  }

  async isAutostartEnabled(): Promise<boolean> {
    return this.isToggleChecked("Launch on Startup");
  }

  get overlayDropdown(): Locator {
    return this.getDropdownTrigger("Overlay Position");
  }

  async selectOverlayPosition(position: "None" | "Bottom" | "Top") {
    await this.selectDropdownOption("Overlay Position", position);
  }

  async getOverlayPosition(): Promise<string> {
    return this.getSelectedDropdownValue("Overlay Position");
  }

  get modelUnloadDropdown(): Locator {
    return this.getDropdownTrigger("Unload Model");
  }

  async selectModelUnloadTimeout(option: string) {
    await this.selectDropdownOption("Unload Model", option);
  }

  async getModelUnloadTimeout(): Promise<string> {
    return this.getSelectedDropdownValue("Unload Model");
  }

  get experimentalToggle(): Locator {
    return this.getToggle("Experimental Features");
  }

  async toggleExperimental() {
    await this.clickToggle("Experimental Features");
  }

  async isExperimentalEnabled(): Promise<boolean> {
    return this.isToggleChecked("Experimental Features");
  }

  // Output Settings Group
  get pasteMethodDropdown(): Locator {
    return this.getDropdownTrigger("Paste Method");
  }

  async selectPasteMethod(method: string) {
    await this.selectDropdownOption("Paste Method", method);
  }

  async getPasteMethod(): Promise<string> {
    return this.getSelectedDropdownValue("Paste Method");
  }

  get clipboardHandlingDropdown(): Locator {
    return this.getDropdownTrigger("Clipboard Handling");
  }

  async selectClipboardHandling(option: string) {
    await this.selectDropdownOption("Clipboard Handling", option);
  }

  async getClipboardHandling(): Promise<string> {
    return this.getSelectedDropdownValue("Clipboard Handling");
  }

  // Transcription Settings Group
  get translateToggle(): Locator {
    return this.getToggle("Translate to English");
  }

  async toggleTranslate() {
    await this.clickToggle("Translate to English");
  }

  async isTranslateEnabled(): Promise<boolean> {
    return this.isToggleChecked("Translate to English");
  }

  isTranslateVisible(): Promise<boolean> {
    return this.page.locator("h3", { hasText: "Translate to English" }).isVisible();
  }

  get trailingSpaceToggle(): Locator {
    return this.getToggle("Append Trailing Space");
  }

  async toggleTrailingSpace() {
    await this.clickToggle("Append Trailing Space");
  }

  async isTrailingSpaceEnabled(): Promise<boolean> {
    return this.isToggleChecked("Append Trailing Space");
  }

  get customWordsInput(): Locator {
    return this.page
      .locator("h3", { hasText: "Custom Words" })
      .locator("..")
      .locator('input[type="text"]');
  }

  get addWordButton(): Locator {
    return this.page.getByRole("button", { name: "Add" });
  }

  async addCustomWord(word: string) {
    await this.customWordsInput.fill(word);
    await this.addWordButton.click();
  }

  getCustomWordChip(word: string): Locator {
    return this.page.locator("button", { hasText: word }).filter({
      has: this.page.locator("svg"),
    });
  }

  async removeCustomWord(word: string) {
    await this.getCustomWordChip(word).click();
  }

  async getCustomWords(): Promise<string[]> {
    const chips = this.page.locator(".flex.flex-wrap.gap-1 button span").all();
    const words: string[] = [];
    for (const chip of await chips) {
      const text = await chip.textContent();
      if (text) words.push(text);
    }
    return words;
  }

  // History Settings Group
  get historyLimitInput(): Locator {
    return this.page
      .locator("h3", { hasText: "History Limit" })
      .locator("..")
      .locator('input[type="number"]');
  }

  async setHistoryLimit(value: number) {
    await this.historyLimitInput.fill(value.toString());
  }

  async getHistoryLimit(): Promise<number> {
    const value = await this.historyLimitInput.inputValue();
    return parseInt(value, 10);
  }

  // Settings group headers
  getSettingsGroup(title: string): Locator {
    return this.page.locator("div", { hasText: title }).first();
  }

  async isSettingsGroupVisible(title: string): Promise<boolean> {
    return this.page.getByText(title, { exact: true }).isVisible();
  }
}
