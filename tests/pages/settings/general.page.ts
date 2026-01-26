import { Page, Locator, expect } from "@playwright/test";

/**
 * Page object for General Settings section.
 * Handles shortcut configuration, audio devices, language, and toggles.
 */
export class GeneralSettingsPage {
  readonly page: Page;

  // Settings groups
  readonly generalGroup: Locator;
  readonly soundGroup: Locator;

  // Shortcut input
  readonly shortcutInput: Locator;
  readonly shortcutResetButton: Locator;

  // Push to talk toggle
  readonly pushToTalkToggle: Locator;

  // Language selector (Whisper models only)
  readonly languageSelector: Locator;
  readonly languageDropdownButton: Locator;
  readonly languageSearchInput: Locator;
  readonly languageOptions: Locator;

  // Microphone selector
  readonly microphoneSelector: Locator;
  readonly microphoneDropdownButton: Locator;
  readonly microphoneOptions: Locator;
  readonly microphoneResetButton: Locator;

  // Mute while recording toggle
  readonly muteWhileRecordingToggle: Locator;

  // Audio feedback toggle
  readonly audioFeedbackToggle: Locator;

  // Output device selector
  readonly outputDeviceSelector: Locator;
  readonly outputDeviceDropdownButton: Locator;
  readonly outputDeviceOptions: Locator;
  readonly outputDeviceResetButton: Locator;

  // Volume slider
  readonly volumeSlider: Locator;
  readonly volumeValue: Locator;

  constructor(page: Page) {
    this.page = page;

    // Settings groups - identified by their headings
    this.generalGroup = page.locator("text=General").first();
    this.soundGroup = page.locator("text=Sound").first();

    // Shortcut input - look for the transcribe shortcut setting
    this.shortcutInput = page
      .locator("text=Transcribe Shortcut")
      .locator("..")
      .locator("..")
      .locator("div")
      .filter({ hasText: /^[A-Za-z+]+$/ })
      .first();
    this.shortcutResetButton = page
      .locator("text=Transcribe Shortcut")
      .locator("..")
      .locator("..")
      .getByRole("button")
      .first();

    // Push to talk - find by label text
    this.pushToTalkToggle = page
      .locator("text=Push To Talk")
      .locator("..")
      .locator("..")
      .locator('input[type="checkbox"]');

    // Language selector - only visible with Whisper models
    this.languageSelector = page.locator("text=Language").locator("..").locator("..");
    this.languageDropdownButton = this.languageSelector.getByRole("button").first();
    this.languageSearchInput = page.locator('input[placeholder*="Search languages"]');
    this.languageOptions = page.locator(
      '.absolute.top-full button:not([disabled])'
    );

    // Microphone selector
    this.microphoneSelector = page.locator("text=Microphone").locator("..").locator("..");
    this.microphoneDropdownButton = this.microphoneSelector
      .getByRole("button")
      .first();
    this.microphoneOptions = page.locator(
      '.absolute.top-full button:not([disabled])'
    );
    this.microphoneResetButton = this.microphoneSelector
      .getByRole("button")
      .last();

    // Mute while recording toggle
    this.muteWhileRecordingToggle = page
      .locator("text=Mute While Recording")
      .locator("..")
      .locator("..")
      .locator('input[type="checkbox"]');

    // Audio feedback toggle
    this.audioFeedbackToggle = page
      .locator("text=Audio Feedback")
      .locator("..")
      .locator("..")
      .locator('input[type="checkbox"]');

    // Output device selector
    this.outputDeviceSelector = page
      .locator("text=Output Device")
      .locator("..")
      .locator("..");
    this.outputDeviceDropdownButton = this.outputDeviceSelector
      .getByRole("button")
      .first();
    this.outputDeviceOptions = page.locator(
      '.absolute.top-full button:not([disabled])'
    );
    this.outputDeviceResetButton = this.outputDeviceSelector
      .getByRole("button")
      .last();

    // Volume slider
    this.volumeSlider = page.locator('input[type="range"]');
    this.volumeValue = page.locator("text=Volume").locator("..").locator("..").locator("span.text-right");
  }

  /**
   * Navigate to general settings (default section)
   */
  async goto() {
    await this.page.goto("/");
    // Wait for the app to load and show General settings
    await this.page.waitForSelector("text=General", { timeout: 10000 });
  }

  /**
   * Click the sidebar to navigate to General section
   */
  async navigateToGeneral() {
    await this.page.locator(".flex.gap-2.items-center").filter({ hasText: "General" }).click();
  }

  /**
   * Check if the General settings section is visible
   */
  async isGeneralSectionVisible(): Promise<boolean> {
    // Look for the General settings group heading
    const generalHeading = this.page.locator("h2, h3").filter({ hasText: /^General$/ });
    return generalHeading.isVisible();
  }

  /**
   * Check if the Sound settings group is visible
   */
  async isSoundSectionVisible(): Promise<boolean> {
    const soundHeading = this.page.locator("h2, h3").filter({ hasText: /^Sound$/ });
    return soundHeading.isVisible();
  }

  /**
   * Get the current shortcut display text
   */
  async getShortcutText(): Promise<string> {
    // Find the clickable shortcut display element
    const shortcutDisplay = this.page
      .locator("text=Transcribe Shortcut")
      .locator("..")
      .locator("..")
      .locator(".cursor-pointer, .cursor-not-allowed")
      .filter({ hasNot: this.page.locator("svg") })
      .first();
    return shortcutDisplay.textContent() ?? "";
  }

  /**
   * Click shortcut input to start recording new shortcut
   */
  async clickShortcutToRecord() {
    const shortcutDisplay = this.page
      .locator("text=Transcribe Shortcut")
      .locator("..")
      .locator("..")
      .locator(".cursor-pointer")
      .filter({ hasNot: this.page.locator("svg") })
      .first();
    await shortcutDisplay.click();
  }

  /**
   * Check if shortcut is in recording mode
   */
  async isShortcutRecording(): Promise<boolean> {
    // When recording, the border becomes logo-primary color
    const recordingIndicator = this.page.locator(".border-logo-primary.bg-logo-primary\\/30");
    return recordingIndicator.isVisible();
  }

  /**
   * Get Push to Talk toggle state
   */
  async isPushToTalkEnabled(): Promise<boolean> {
    return this.pushToTalkToggle.isChecked();
  }

  /**
   * Toggle Push to Talk
   */
  async togglePushToTalk() {
    const label = this.page
      .locator("text=Push To Talk")
      .locator("..")
      .locator("..")
      .locator("label");
    await label.click();
  }

  /**
   * Check if language selector is visible (only for Whisper models)
   */
  async isLanguageSelectorVisible(): Promise<boolean> {
    const languageLabel = this.page.locator("h3").filter({ hasText: /^Language$/ });
    return languageLabel.isVisible();
  }

  /**
   * Get currently selected language
   */
  async getSelectedLanguage(): Promise<string> {
    const button = this.page
      .locator("text=Language")
      .locator("..")
      .locator("..")
      .getByRole("button")
      .first();
    return (await button.textContent()) ?? "";
  }

  /**
   * Open language dropdown
   */
  async openLanguageDropdown() {
    await this.languageDropdownButton.click();
  }

  /**
   * Search for a language
   */
  async searchLanguage(query: string) {
    await this.languageSearchInput.fill(query);
  }

  /**
   * Check if microphone selector is visible
   */
  async isMicrophoneSelectorVisible(): Promise<boolean> {
    const micLabel = this.page.locator("h3").filter({ hasText: /^Microphone$/ });
    return micLabel.isVisible();
  }

  /**
   * Get currently selected microphone
   */
  async getSelectedMicrophone(): Promise<string> {
    const button = this.page
      .locator("text=Microphone")
      .locator("..")
      .locator("..")
      .getByRole("button")
      .first();
    return (await button.textContent()) ?? "";
  }

  /**
   * Open microphone dropdown
   */
  async openMicrophoneDropdown() {
    await this.microphoneDropdownButton.click();
  }

  /**
   * Check if mute while recording toggle is visible
   */
  async isMuteWhileRecordingVisible(): Promise<boolean> {
    const label = this.page.locator("h3").filter({ hasText: /^Mute While Recording$/ });
    return label.isVisible();
  }

  /**
   * Get Mute While Recording toggle state
   */
  async isMuteWhileRecordingEnabled(): Promise<boolean> {
    return this.muteWhileRecordingToggle.isChecked();
  }

  /**
   * Toggle Mute While Recording
   */
  async toggleMuteWhileRecording() {
    const label = this.page
      .locator("text=Mute While Recording")
      .locator("..")
      .locator("..")
      .locator("label");
    await label.click();
  }

  /**
   * Check if audio feedback toggle is visible
   */
  async isAudioFeedbackVisible(): Promise<boolean> {
    const label = this.page.locator("h3").filter({ hasText: /^Audio Feedback$/ });
    return label.isVisible();
  }

  /**
   * Get Audio Feedback toggle state
   */
  async isAudioFeedbackEnabled(): Promise<boolean> {
    return this.audioFeedbackToggle.isChecked();
  }

  /**
   * Toggle Audio Feedback
   */
  async toggleAudioFeedback() {
    const label = this.page
      .locator("text=Audio Feedback")
      .locator("..")
      .locator("..")
      .locator("label");
    await label.click();
  }

  /**
   * Check if output device selector is visible
   */
  async isOutputDeviceSelectorVisible(): Promise<boolean> {
    const label = this.page.locator("h3").filter({ hasText: /^Output Device$/ });
    return label.isVisible();
  }

  /**
   * Get currently selected output device
   */
  async getSelectedOutputDevice(): Promise<string> {
    const button = this.page
      .locator("text=Output Device")
      .locator("..")
      .locator("..")
      .getByRole("button")
      .first();
    return (await button.textContent()) ?? "";
  }

  /**
   * Open output device dropdown
   */
  async openOutputDeviceDropdown() {
    await this.outputDeviceDropdownButton.click();
  }

  /**
   * Check if volume slider is visible
   */
  async isVolumeSliderVisible(): Promise<boolean> {
    const label = this.page.locator("h3").filter({ hasText: /^Volume$/ });
    return label.isVisible();
  }

  /**
   * Get current volume value
   */
  async getVolumeValue(): Promise<number> {
    const value = await this.volumeSlider.inputValue();
    return parseFloat(value);
  }

  /**
   * Get displayed volume percentage
   */
  async getVolumePercentage(): Promise<string> {
    return (await this.volumeValue.textContent()) ?? "";
  }

  /**
   * Set volume slider value
   */
  async setVolume(value: number) {
    await this.volumeSlider.fill(value.toString());
  }

  /**
   * Check if output device selector is disabled (depends on audio feedback)
   */
  async isOutputDeviceDisabled(): Promise<boolean> {
    const button = this.page
      .locator("text=Output Device")
      .locator("..")
      .locator("..")
      .getByRole("button")
      .first();
    return button.isDisabled();
  }

  /**
   * Check if volume slider is disabled (depends on audio feedback)
   */
  async isVolumeSliderDisabled(): Promise<boolean> {
    return this.volumeSlider.isDisabled();
  }
}
