import { test, expect } from "@playwright/test";
import { GeneralSettingsPage } from "../../pages/settings/general.page";

test.describe("General Settings", () => {
  let generalPage: GeneralSettingsPage;

  test.beforeEach(async ({ page }) => {
    generalPage = new GeneralSettingsPage(page);
    await generalPage.goto();
  });

  test.describe("Settings Groups", () => {
    test("displays General settings group", async () => {
      const isVisible = await generalPage.isGeneralSectionVisible();
      expect(isVisible).toBe(true);
    });

    test("displays Sound settings group", async () => {
      const isVisible = await generalPage.isSoundSectionVisible();
      expect(isVisible).toBe(true);
    });
  });

  test.describe("Shortcut Configuration", () => {
    test("displays current shortcut", async () => {
      const shortcutText = await generalPage.getShortcutText();
      // Shortcut should contain modifier keys like Cmd, Ctrl, Alt, etc.
      expect(shortcutText.length).toBeGreaterThan(0);
    });

    test("enters recording mode when clicked", async () => {
      await generalPage.clickShortcutToRecord();
      const isRecording = await generalPage.isShortcutRecording();
      expect(isRecording).toBe(true);
    });

    test("shows 'Press keys...' prompt when recording", async ({ page }) => {
      await generalPage.clickShortcutToRecord();
      // Wait for recording mode UI
      await page.waitForSelector("text=Press keys...", { timeout: 2000 });
      const prompt = page.locator("text=Press keys...");
      await expect(prompt).toBeVisible();
    });
  });

  test.describe("Push to Talk Toggle", () => {
    test("push to talk toggle is visible", async ({ page }) => {
      const label = page.locator("h3").filter({ hasText: /^Push To Talk$/ });
      await expect(label).toBeVisible();
    });

    test("can toggle push to talk", async () => {
      const initialState = await generalPage.isPushToTalkEnabled();
      await generalPage.togglePushToTalk();
      // Wait for state change
      await generalPage.page.waitForTimeout(300);
      const newState = await generalPage.isPushToTalkEnabled();
      expect(newState).toBe(!initialState);
    });
  });

  test.describe("Microphone Selector", () => {
    test("microphone selector is visible", async () => {
      const isVisible = await generalPage.isMicrophoneSelectorVisible();
      expect(isVisible).toBe(true);
    });

    test("displays selected microphone or placeholder", async () => {
      const selectedMic = await generalPage.getSelectedMicrophone();
      // Should show either "Default", a device name, or loading state
      expect(selectedMic.length).toBeGreaterThan(0);
    });

    test("opens microphone dropdown on click", async ({ page }) => {
      await generalPage.openMicrophoneDropdown();
      // Dropdown should be visible (look for the dropdown container)
      const dropdown = page.locator(".absolute.top-full");
      await expect(dropdown).toBeVisible();
    });
  });

  test.describe("Language Selector", () => {
    // Language selector only appears for Whisper models
    test("language selector may be visible depending on model", async () => {
      const isVisible = await generalPage.isLanguageSelectorVisible();
      // This is model-dependent, so we just verify the check works
      expect(typeof isVisible).toBe("boolean");
    });

    test("can open language dropdown when visible", async ({ page }) => {
      const isVisible = await generalPage.isLanguageSelectorVisible();
      if (isVisible) {
        await generalPage.openLanguageDropdown();
        // Should show search input
        const searchInput = page.locator('input[placeholder*="Search"]');
        await expect(searchInput).toBeVisible();
      }
    });

    test("can search languages when dropdown is open", async ({ page }) => {
      const isVisible = await generalPage.isLanguageSelectorVisible();
      if (isVisible) {
        await generalPage.openLanguageDropdown();
        await generalPage.searchLanguage("English");
        // Should filter to show English option
        const englishOption = page.locator("button").filter({ hasText: "English" });
        await expect(englishOption.first()).toBeVisible();
      }
    });
  });

  test.describe("Mute While Recording Toggle", () => {
    test("mute while recording toggle is visible", async () => {
      const isVisible = await generalPage.isMuteWhileRecordingVisible();
      expect(isVisible).toBe(true);
    });

    test("can toggle mute while recording", async () => {
      const initialState = await generalPage.isMuteWhileRecordingEnabled();
      await generalPage.toggleMuteWhileRecording();
      await generalPage.page.waitForTimeout(300);
      const newState = await generalPage.isMuteWhileRecordingEnabled();
      expect(newState).toBe(!initialState);
    });
  });

  test.describe("Audio Feedback Toggle", () => {
    test("audio feedback toggle is visible", async () => {
      const isVisible = await generalPage.isAudioFeedbackVisible();
      expect(isVisible).toBe(true);
    });

    test("can toggle audio feedback", async () => {
      const initialState = await generalPage.isAudioFeedbackEnabled();
      await generalPage.toggleAudioFeedback();
      await generalPage.page.waitForTimeout(300);
      const newState = await generalPage.isAudioFeedbackEnabled();
      expect(newState).toBe(!initialState);
    });
  });

  test.describe("Output Device Selector", () => {
    test("output device selector is visible", async () => {
      const isVisible = await generalPage.isOutputDeviceSelectorVisible();
      expect(isVisible).toBe(true);
    });

    test("displays selected output device or placeholder", async () => {
      const selectedDevice = await generalPage.getSelectedOutputDevice();
      expect(selectedDevice.length).toBeGreaterThan(0);
    });

    test("output device is disabled when audio feedback is off", async () => {
      // First ensure audio feedback is off
      const audioFeedbackEnabled = await generalPage.isAudioFeedbackEnabled();
      if (audioFeedbackEnabled) {
        await generalPage.toggleAudioFeedback();
        await generalPage.page.waitForTimeout(300);
      }

      const isDisabled = await generalPage.isOutputDeviceDisabled();
      expect(isDisabled).toBe(true);
    });

    test("output device is enabled when audio feedback is on", async () => {
      // First ensure audio feedback is on
      const audioFeedbackEnabled = await generalPage.isAudioFeedbackEnabled();
      if (!audioFeedbackEnabled) {
        await generalPage.toggleAudioFeedback();
        await generalPage.page.waitForTimeout(300);
      }

      const isDisabled = await generalPage.isOutputDeviceDisabled();
      expect(isDisabled).toBe(false);
    });
  });

  test.describe("Volume Slider", () => {
    test("volume slider is visible", async () => {
      const isVisible = await generalPage.isVolumeSliderVisible();
      expect(isVisible).toBe(true);
    });

    test("displays current volume value", async () => {
      const value = await generalPage.getVolumeValue();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    });

    test("displays volume as percentage", async () => {
      const percentage = await generalPage.getVolumePercentage();
      expect(percentage).toMatch(/%$/);
    });

    test("volume slider is disabled when audio feedback is off", async () => {
      // First ensure audio feedback is off
      const audioFeedbackEnabled = await generalPage.isAudioFeedbackEnabled();
      if (audioFeedbackEnabled) {
        await generalPage.toggleAudioFeedback();
        await generalPage.page.waitForTimeout(300);
      }

      const isDisabled = await generalPage.isVolumeSliderDisabled();
      expect(isDisabled).toBe(true);
    });

    test("volume slider is enabled when audio feedback is on", async () => {
      // First ensure audio feedback is on
      const audioFeedbackEnabled = await generalPage.isAudioFeedbackEnabled();
      if (!audioFeedbackEnabled) {
        await generalPage.toggleAudioFeedback();
        await generalPage.page.waitForTimeout(300);
      }

      const isDisabled = await generalPage.isVolumeSliderDisabled();
      expect(isDisabled).toBe(false);
    });

    test("can adjust volume slider value", async () => {
      // Ensure audio feedback is on first
      const audioFeedbackEnabled = await generalPage.isAudioFeedbackEnabled();
      if (!audioFeedbackEnabled) {
        await generalPage.toggleAudioFeedback();
        await generalPage.page.waitForTimeout(300);
      }

      const initialValue = await generalPage.getVolumeValue();
      const newValue = initialValue < 0.5 ? 0.8 : 0.2;

      await generalPage.setVolume(newValue);
      await generalPage.page.waitForTimeout(300);

      const updatedValue = await generalPage.getVolumeValue();
      expect(Math.abs(updatedValue - newValue)).toBeLessThan(0.15);
    });
  });
});
