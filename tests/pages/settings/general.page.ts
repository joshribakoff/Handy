import { Page, Locator } from "@playwright/test";

/**
 * Page object for General Settings section.
 * Uses semantic selectors (getByRole, getByText, getByLabel) for resilient tests.
 */
export class GeneralSettingsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to general settings (default section)
   */
  async goto() {
    await this.page.goto("/");
    await this.page.getByRole("heading", { name: "General" }).first().waitFor();
  }

  // --- Locators using semantic selectors ---

  /** General settings group heading */
  get generalHeading(): Locator {
    return this.page.getByRole("heading", { name: /^General$/ });
  }

  /** Sound settings group heading */
  get soundHeading(): Locator {
    return this.page.getByRole("heading", { name: /^Sound$/ });
  }

  /** Push to Talk switch */
  get pushToTalkSwitch(): Locator {
    return this.page.getByRole("checkbox", { name: /push to talk/i });
  }

  /** Mute While Recording switch */
  get muteWhileRecordingSwitch(): Locator {
    return this.page.getByRole("checkbox", { name: /mute while recording/i });
  }

  /** Audio Feedback switch */
  get audioFeedbackSwitch(): Locator {
    return this.page.getByRole("checkbox", { name: /audio feedback/i });
  }

  /** Volume slider */
  get volumeSlider(): Locator {
    return this.page.getByRole("slider");
  }

  /** Microphone dropdown button */
  get microphoneDropdown(): Locator {
    return this.page
      .locator("div")
      .filter({ has: this.page.getByText("Microphone", { exact: true }) })
      .getByRole("button")
      .first();
  }

  /** Output Device dropdown button */
  get outputDeviceDropdown(): Locator {
    return this.page
      .locator("div")
      .filter({ has: this.page.getByText("Output Device", { exact: true }) })
      .getByRole("button")
      .first();
  }

  /** Language dropdown button (Whisper models only) */
  get languageDropdown(): Locator {
    return this.page
      .locator("div")
      .filter({ has: this.page.getByText("Language", { exact: true }) })
      .getByRole("button")
      .first();
  }

  /** Transcribe Shortcut display */
  get shortcutDisplay(): Locator {
    return this.page
      .locator("div")
      .filter({ has: this.page.getByText("Transcribe Shortcut") })
      .locator(".cursor-pointer")
      .first();
  }

  /** "Press keys..." prompt shown during shortcut recording */
  get shortcutRecordingPrompt(): Locator {
    return this.page.getByText("Press keys...");
  }

  // --- Helper methods ---

  /** Get the text label for a setting by heading */
  getSettingLabel(name: string): Locator {
    return this.page.getByRole("heading", { name, level: 3 });
  }

  /** Get the dropdown menu container */
  get dropdownMenu(): Locator {
    return this.page.locator(".absolute.top-full");
  }

  /** Search input in language dropdown */
  get languageSearchInput(): Locator {
    return this.page.getByPlaceholder(/search languages/i);
  }
}
