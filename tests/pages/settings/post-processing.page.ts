import { type Locator, type Page } from "@playwright/test";

/**
 * Page object for Post-Processing settings section.
 * Post-processing is an experimental feature (requires `experimental_enabled` setting).
 * The toggle is in Advanced Settings under "Experimental" group.
 * When enabled, a dedicated "Post Process" section appears in the sidebar.
 */
export class PostProcessingPage {
  readonly page: Page;

  // API Settings
  readonly providerDropdown: Locator;
  readonly apiKeyInput: Locator;
  readonly baseUrlInput: Locator;
  readonly modelRefreshButton: Locator;

  // Prompts
  readonly createPromptButton: Locator;
  readonly promptLabelInput: Locator;
  readonly promptTextarea: Locator;
  readonly updatePromptButton: Locator;
  readonly deletePromptButton: Locator;
  readonly cancelButton: Locator;
  readonly createPromptSubmitButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Provider dropdown - use accessible role
    this.providerDropdown = page.getByRole("combobox", { name: /provider/i });

    // API Key input - use label association
    this.apiKeyInput = page.getByLabel(/api key/i);

    // Base URL input - use label association
    this.baseUrlInput = page.getByLabel(/base url/i);

    // Model refresh button
    this.modelRefreshButton = page.getByRole("button", { name: /refresh/i });

    // Create new prompt button
    this.createPromptButton = page.getByRole("button", {
      name: /create new prompt/i,
    });

    // Prompt editing fields
    this.promptLabelInput = page.getByLabel(/prompt label/i);
    this.promptTextarea = page.getByRole("textbox", { name: /instruction/i });

    // Action buttons
    this.updatePromptButton = page.getByRole("button", {
      name: /update prompt/i,
    });
    this.deletePromptButton = page.getByRole("button", {
      name: /delete prompt/i,
    });
    this.cancelButton = page.getByRole("button", { name: /cancel/i });
    this.createPromptSubmitButton = page.getByRole("button", {
      name: /^create prompt$/i,
    });
  }

  /** Check if the main app (with sidebar navigation) is visible, vs onboarding flow */
  async isMainAppVisible(): Promise<boolean> {
    try {
      const nav = this.page.getByRole("navigation");
      return await nav.isVisible({ timeout: 2000 });
    } catch {
      return false;
    }
  }

  /** Navigate to the Post Processing section via sidebar */
  async goto() {
    await this.page.goto("/");
    await this.page.getByRole("link", { name: /post process/i }).click();
  }

  /** Navigate to Advanced Settings */
  async gotoAdvanced() {
    await this.page.goto("/");
    const isMainApp = await this.isMainAppVisible();
    if (!isMainApp) {
      throw new Error(
        "Cannot navigate to Advanced - app is in onboarding flow",
      );
    }
    await this.page.getByRole("link", { name: /advanced/i }).click();
  }

  /** Check if the post-processing section is visible in sidebar */
  async isPostProcessingSectionVisible(): Promise<boolean> {
    const sidebarItem = this.page.getByRole("link", { name: /post process/i });
    return sidebarItem.isVisible();
  }

  /** Get the post-processing toggle switch */
  getPostProcessingToggle() {
    return this.page.getByRole("switch", { name: /post processing/i });
  }

  /** Toggle post-processing on/off */
  async togglePostProcessing() {
    const toggle = this.getPostProcessingToggle();
    await toggle.click();
  }

  /** Check if post-processing is enabled */
  async isPostProcessingEnabled(): Promise<boolean> {
    const toggle = this.getPostProcessingToggle();
    return toggle.isChecked();
  }

  /** Select a provider from the dropdown */
  async selectProvider(providerName: string) {
    await this.providerDropdown.click();
    await this.page.getByRole("option", { name: providerName }).click();
  }

  /** Get the current selected provider text */
  async getSelectedProvider(): Promise<string> {
    return (await this.providerDropdown.textContent()) || "";
  }

  /** Enter API key */
  async enterApiKey(key: string) {
    await this.apiKeyInput.fill(key);
    await this.apiKeyInput.blur();
  }

  /** Enter base URL (for custom provider) */
  async enterBaseUrl(url: string) {
    await this.baseUrlInput.fill(url);
    await this.baseUrlInput.blur();
  }

  /** Check if base URL field is visible (only for custom provider) */
  async isBaseUrlVisible(): Promise<boolean> {
    return this.baseUrlInput.isVisible();
  }

  /** Check if API key field is password type */
  async isApiKeyMasked(): Promise<boolean> {
    const type = await this.apiKeyInput.getAttribute("type");
    return type === "password";
  }

  /** Create a new prompt */
  async createPrompt(label: string, instructions: string) {
    await this.createPromptButton.click();
    await this.promptLabelInput.fill(label);
    await this.promptTextarea.fill(instructions);
    await this.createPromptSubmitButton.click();
  }

  /** Get available provider options */
  async getProviderOptions(): Promise<string[]> {
    await this.providerDropdown.click();
    const options = await this.page.getByRole("option").allTextContents();
    await this.page.keyboard.press("Escape");
    return options;
  }
}
