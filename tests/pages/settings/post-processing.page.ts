import { type Locator, type Page } from "@playwright/test";

/**
 * Page object for Post-Processing settings section.
 * Post-processing is an experimental feature (requires `experimental_enabled` setting).
 * The toggle is in Advanced Settings under "Experimental" group.
 * When enabled, a dedicated "Post Process" section appears in the sidebar.
 */
export class PostProcessingPage {
  readonly page: Page;

  // API Settings group
  readonly apiSettingsGroup: Locator;
  readonly providerDropdown: Locator;
  readonly providerDropdownButton: Locator;
  readonly apiKeyInput: Locator;
  readonly baseUrlInput: Locator;
  readonly modelSelect: Locator;
  readonly modelRefreshButton: Locator;

  // Prompts group
  readonly promptsSettingsGroup: Locator;
  readonly promptSelector: Locator;
  readonly createPromptButton: Locator;
  readonly promptLabelInput: Locator;
  readonly promptTextarea: Locator;
  readonly updatePromptButton: Locator;
  readonly deletePromptButton: Locator;
  readonly cancelButton: Locator;
  readonly createPromptSubmitButton: Locator;

  // Disabled notice (shown when post-processing is off)
  readonly disabledNotice: Locator;

  // Sidebar locator
  readonly sidebar: Locator;

  constructor(page: Page) {
    this.page = page;

    // Sidebar
    this.sidebar = page.locator(".flex.flex-col.w-40");

    // API Settings group - contains provider, api key, base url, model
    this.apiSettingsGroup = page.locator("text=API (OpenAI Compatible)").locator("..");

    // Provider dropdown
    this.providerDropdownButton = page.locator("button").filter({ hasText: /OpenAI|Ollama|Custom|Apple Intelligence/ }).first();
    this.providerDropdown = page.locator(".relative").filter({ has: this.providerDropdownButton });

    // API Key input (password field)
    this.apiKeyInput = page.locator('input[type="password"]');

    // Base URL input (only visible for custom provider)
    this.baseUrlInput = page.locator('input[placeholder*="https://"]');

    // Model select (combobox-style select)
    this.modelSelect = page.locator('[class*="react-select"]').first();

    // Model refresh button
    this.modelRefreshButton = page.getByRole("button", { name: /refresh/i });

    // Prompts Settings group
    this.promptsSettingsGroup = page.locator("text=Prompt").locator("..").first();

    // Prompt selector dropdown
    this.promptSelector = page.locator("text=Selected Prompt").locator("..").locator("button").first();

    // Create new prompt button
    this.createPromptButton = page.getByRole("button", { name: /create new prompt/i });

    // Prompt editing fields
    this.promptLabelInput = page.locator("text=Prompt Label").locator("..").locator("input");
    this.promptTextarea = page.locator("textarea");

    // Action buttons
    this.updatePromptButton = page.getByRole("button", { name: /update prompt/i });
    this.deletePromptButton = page.getByRole("button", { name: /delete prompt/i });
    this.cancelButton = page.getByRole("button", { name: /cancel/i });
    this.createPromptSubmitButton = page.getByRole("button", { name: /^create prompt$/i });

    // Disabled notice
    this.disabledNotice = page.locator("text=Post processing is currently disabled");
  }

  /** Check if the main app (with sidebar) is visible, vs onboarding flow */
  async isMainAppVisible(): Promise<boolean> {
    try {
      // The sidebar is only present when not in onboarding
      return await this.sidebar.isVisible({ timeout: 2000 });
    } catch {
      return false;
    }
  }

  /** Navigate to the Post Processing section via sidebar */
  async goto() {
    await this.page.goto("/");
    // Click on Post Process in the sidebar (only visible if post_process_enabled)
    await this.page.locator("text=Post Process").click();
  }

  /** Navigate to Advanced Settings (only works if main app is visible) */
  async gotoAdvanced() {
    await this.page.goto("/");
    // Wait for either sidebar or detect onboarding
    const isMainApp = await this.isMainAppVisible();
    if (!isMainApp) {
      throw new Error("Cannot navigate to Advanced - app is in onboarding flow");
    }
    await this.sidebar.locator("text=Advanced").click();
  }

  /** Check if the post-processing section is visible in sidebar */
  async isPostProcessingSectionVisible(): Promise<boolean> {
    const sidebarItem = this.page.locator(".flex.flex-col.w-40").locator("text=Post Process");
    return sidebarItem.isVisible();
  }

  /** Get the experimental settings group in Advanced Settings */
  getExperimentalGroup() {
    return this.page.locator("text=Experimental").locator("..");
  }

  /** Get the post-processing toggle in experimental group */
  getPostProcessingToggle() {
    return this.page.locator("text=Post Processing").locator("..").locator('input[type="checkbox"]');
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
    await this.providerDropdownButton.click();
    await this.page.locator(`button:has-text("${providerName}")`).click();
  }

  /** Get the current selected provider text */
  async getSelectedProvider(): Promise<string> {
    return (await this.providerDropdownButton.textContent()) || "";
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
    await this.providerDropdownButton.click();
    const options = await this.page.locator(".absolute.top-full button").allTextContents();
    // Close dropdown
    await this.page.keyboard.press("Escape");
    return options;
  }
}
