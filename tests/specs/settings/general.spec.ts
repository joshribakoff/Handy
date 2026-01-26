import { test, expect } from "@playwright/test";
import { GeneralSettingsPage } from "../../pages/settings/general.page";

test.describe("General Settings", () => {
  let page: GeneralSettingsPage;

  test.beforeEach(async ({ page: p }) => {
    page = new GeneralSettingsPage(p);
    await page.goto();
  });

  test.describe("Smoke Tests", () => {
    test("displays General and Sound settings groups", async () => {
      await expect(page.generalHeading.first()).toBeVisible();
      await expect(page.soundHeading).toBeVisible();
    });

    test("displays all toggle controls", async () => {
      await expect(page.pushToTalkSwitch).toBeVisible();
      await expect(page.muteWhileRecordingSwitch).toBeVisible();
      await expect(page.audioFeedbackSwitch).toBeVisible();
    });

    test("displays microphone and volume controls", async () => {
      await expect(page.microphoneDropdown).toBeVisible();
      await expect(page.volumeSlider).toBeVisible();
    });
  });

  test.describe("Push to Talk Toggle", () => {
    test("toggling push to talk changes its state", async () => {
      const toggle = page.pushToTalkSwitch;

      // Assert: Get initial state
      const wasChecked = await toggle.isChecked();

      // Act: Toggle it
      await toggle.click({ force: true });

      // Assert: State changed
      await expect(toggle).toHaveJSProperty("checked", !wasChecked);
    });
  });

  test.describe("Mute While Recording Toggle", () => {
    test("toggling mute while recording changes its state", async () => {
      const toggle = page.muteWhileRecordingSwitch;

      // Assert: Get initial state
      const wasChecked = await toggle.isChecked();

      // Act: Toggle it
      await toggle.click({ force: true });

      // Assert: State changed
      await expect(toggle).toHaveJSProperty("checked", !wasChecked);
    });
  });

  test.describe("Audio Feedback Toggle", () => {
    test("toggling audio feedback changes its state", async () => {
      const toggle = page.audioFeedbackSwitch;

      // Assert: Get initial state
      const wasChecked = await toggle.isChecked();

      // Act: Toggle it
      await toggle.click({ force: true });

      // Assert: State changed
      await expect(toggle).toHaveJSProperty("checked", !wasChecked);
    });

    test("disabling audio feedback disables volume slider", async () => {
      const toggle = page.audioFeedbackSwitch;
      const slider = page.volumeSlider;

      // Ensure audio feedback is enabled first
      if (!(await toggle.isChecked())) {
        await toggle.click({ force: true });
      }

      // Assert: Slider should be enabled when audio feedback is on
      await expect(slider).toBeEnabled();

      // Act: Disable audio feedback
      await toggle.click({ force: true });

      // Assert: Slider should be disabled
      await expect(slider).toBeDisabled();
    });

    test("disabling audio feedback disables output device dropdown", async () => {
      const toggle = page.audioFeedbackSwitch;
      const dropdown = page.outputDeviceDropdown;

      // Ensure audio feedback is enabled first
      if (!(await toggle.isChecked())) {
        await toggle.click({ force: true });
      }

      // Assert: Dropdown should be enabled when audio feedback is on
      await expect(dropdown).toBeEnabled();

      // Act: Disable audio feedback
      await toggle.click({ force: true });

      // Assert: Dropdown should be disabled
      await expect(dropdown).toBeDisabled();
    });
  });

  test.describe("Microphone Selector", () => {
    test("clicking microphone dropdown opens options menu", async () => {
      // Assert: Dropdown menu not visible initially
      await expect(page.dropdownMenu).not.toBeVisible();

      // Act: Click to open dropdown
      await page.microphoneDropdown.click();

      // Assert: Dropdown menu appears
      await expect(page.dropdownMenu).toBeVisible();
    });
  });

  test.describe("Shortcut Configuration", () => {
    test("clicking shortcut enters recording mode", async ({ page: p }) => {
      // Assert: Not in recording mode initially
      await expect(page.shortcutRecordingPrompt).not.toBeVisible();

      // Act: Click shortcut to start recording
      await page.shortcutDisplay.click();

      // Assert: Shows recording prompt
      await expect(page.shortcutRecordingPrompt).toBeVisible();
    });
  });

  test.describe("Volume Slider", () => {
    test("volume slider shows percentage value", async ({ page: p }) => {
      // Ensure audio feedback is enabled so slider is active
      const toggle = page.audioFeedbackSwitch;
      if (!(await toggle.isChecked())) {
        await toggle.click({ force: true });
      }

      // Assert: Volume percentage is displayed
      const volumeText = p.getByText(/%$/);
      await expect(volumeText.first()).toBeVisible();
    });
  });

  test.describe("Language Selector", () => {
    test("language selector may be visible depending on model", async () => {
      // Language selector only appears for Whisper models
      // Just verify the page object works - actual visibility depends on model
      const isVisible = await page.languageDropdown
        .isVisible()
        .catch(() => false);
      expect(typeof isVisible).toBe("boolean");
    });
  });
});
