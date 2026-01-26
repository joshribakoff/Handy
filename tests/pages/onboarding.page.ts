import { type Page, type Locator, expect } from "@playwright/test";

/**
 * Page object for onboarding screens (model selection and permissions)
 */
export class OnboardingPage {
  readonly page: Page;

  // Model selection screen
  readonly logo: Locator;
  readonly subtitle: Locator;
  readonly modelCards: Locator;
  readonly featuredModelCard: Locator;
  readonly recommendedBadge: Locator;
  readonly errorMessage: Locator;

  // Permissions screen
  readonly permissionsTitle: Locator;
  readonly permissionsDescription: Locator;
  readonly microphoneCard: Locator;
  readonly accessibilityCard: Locator;
  readonly grantPermissionButtons: Locator;
  readonly permissionGrantedIndicators: Locator;
  readonly permissionWaitingIndicators: Locator;
  readonly allGrantedMessage: Locator;
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    this.page = page;

    // Model selection screen locators
    this.logo = page.locator("svg").first(); // HandyTextLogo
    this.subtitle = page.getByText("To get started, choose a transcription model");
    this.modelCards = page.locator("button").filter({ has: page.locator("h3") });
    this.featuredModelCard = page.locator("button").filter({
      has: page.getByText("Recommended"),
    });
    this.recommendedBadge = page.getByText("Recommended");
    this.errorMessage = page.locator(".bg-red-500\\/10");

    // Permissions screen locators
    this.permissionsTitle = page.getByText("Permissions Required");
    this.permissionsDescription = page.getByText(
      "Handy needs a couple of permissions to work properly."
    );
    this.microphoneCard = page.locator("div").filter({
      has: page.getByText("Microphone Access"),
    });
    this.accessibilityCard = page.locator("div").filter({
      has: page.getByText("Accessibility Access"),
    });
    this.grantPermissionButtons = page.getByRole("button", {
      name: "Grant Permission",
    });
    this.permissionGrantedIndicators = page.getByText("Granted");
    this.permissionWaitingIndicators = page.getByText("Waiting...");
    this.allGrantedMessage = page.getByText("All set!");
    this.loadingSpinner = page.locator(".animate-spin");
  }

  async goto() {
    await this.page.goto("/");
  }

  /**
   * Wait for onboarding screen to be visible (either permissions or model selection)
   */
  async waitForOnboarding() {
    // Wait for either permissions screen or model selection screen
    await Promise.race([
      this.permissionsTitle.waitFor({ state: "visible", timeout: 10000 }),
      this.subtitle.waitFor({ state: "visible", timeout: 10000 }),
    ]);
  }

  /**
   * Check if currently on permissions screen
   */
  async isOnPermissionsScreen(): Promise<boolean> {
    return this.permissionsTitle.isVisible();
  }

  /**
   * Check if currently on model selection screen
   */
  async isOnModelSelectionScreen(): Promise<boolean> {
    return this.subtitle.isVisible();
  }

  /**
   * Get all model cards
   */
  async getModelCards(): Promise<Locator[]> {
    await this.modelCards.first().waitFor({ state: "visible" });
    return this.modelCards.all();
  }

  /**
   * Get model card by name
   */
  getModelCardByName(name: string): Locator {
    return this.page.locator("button").filter({
      has: this.page.getByRole("heading", { name, exact: false }),
    });
  }

  /**
   * Get model info from a card
   */
  async getModelInfo(card: Locator): Promise<{
    name: string;
    description: string;
    size: string;
    isFeatured: boolean;
  }> {
    const name = await card.locator("h3").textContent();
    const description = await card.locator("p").first().textContent();
    const sizeText = await card.locator(".tabular-nums span.font-medium").textContent();
    const isFeatured = await card.getByText("Recommended").isVisible();

    return {
      name: name?.trim() || "",
      description: description?.trim() || "",
      size: sizeText?.trim() || "",
      isFeatured,
    };
  }

  /**
   * Click on a model card to trigger download
   */
  async selectModel(modelName: string) {
    const card = this.getModelCardByName(modelName);
    await card.click();
  }

  /**
   * Click the featured/recommended model
   */
  async selectRecommendedModel() {
    await this.featuredModelCard.click();
  }

  /**
   * Grant microphone permission (clicks the button)
   */
  async grantMicrophonePermission() {
    const micButton = this.microphoneCard.getByRole("button", {
      name: "Grant Permission",
    });
    await micButton.click();
  }

  /**
   * Grant accessibility permission (clicks the button)
   */
  async grantAccessibilityPermission() {
    const accessButton = this.accessibilityCard.getByRole("button", {
      name: "Grant Permission",
    });
    await accessButton.click();
  }

  /**
   * Check if microphone permission is granted
   */
  async isMicrophoneGranted(): Promise<boolean> {
    return this.microphoneCard.getByText("Granted").isVisible();
  }

  /**
   * Check if accessibility permission is granted
   */
  async isAccessibilityGranted(): Promise<boolean> {
    return this.accessibilityCard.getByText("Granted").isVisible();
  }

  /**
   * Wait for model selection screen after permissions
   */
  async waitForModelSelectionScreen() {
    await this.subtitle.waitFor({ state: "visible", timeout: 10000 });
  }

  /**
   * Wait for main app after onboarding completes
   */
  async waitForMainApp() {
    // Main app has sidebar with "General" section
    await this.page.getByText("General").waitFor({ state: "visible", timeout: 15000 });
  }

  /**
   * Get the accuracy progress bar width percentage for a model card
   */
  async getAccuracyScore(card: Locator): Promise<number> {
    const accuracyBar = card
      .locator("div")
      .filter({ hasText: "accuracy" })
      .locator(".bg-logo-primary");
    const style = await accuracyBar.getAttribute("style");
    const match = style?.match(/width:\s*(\d+)%/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Get the speed progress bar width percentage for a model card
   */
  async getSpeedScore(card: Locator): Promise<number> {
    const speedBar = card
      .locator("div")
      .filter({ hasText: "speed" })
      .locator(".bg-logo-primary");
    const style = await speedBar.getAttribute("style");
    const match = style?.match(/width:\s*(\d+)%/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Check if there's an error displayed
   */
  async hasError(): Promise<boolean> {
    return this.errorMessage.isVisible();
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    if (await this.hasError()) {
      return (await this.errorMessage.textContent()) || "";
    }
    return "";
  }
}
