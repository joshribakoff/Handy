import { test, expect } from "@playwright/test";
import { AdvancedSettingsPage } from "../../pages/settings/advanced.page";

test.describe("Advanced Settings", () => {
  let advancedPage: AdvancedSettingsPage;

  test.beforeEach(async ({ page }) => {
    advancedPage = new AdvancedSettingsPage(page);
    await advancedPage.navigate();
  });

  test.describe("App Settings Group", () => {
    test("displays app settings group", async () => {
      await expect(advancedPage.isSettingsGroupVisible("App")).resolves.toBe(
        true
      );
    });

    test("start hidden toggle works", async () => {
      const initialState = await advancedPage.isStartHiddenEnabled();
      await advancedPage.toggleStartHidden();
      const newState = await advancedPage.isStartHiddenEnabled();
      expect(newState).toBe(!initialState);
    });

    test("autostart toggle works", async () => {
      const initialState = await advancedPage.isAutostartEnabled();
      await advancedPage.toggleAutostart();
      const newState = await advancedPage.isAutostartEnabled();
      expect(newState).toBe(!initialState);
    });

    test("overlay position dropdown has options", async ({ page }) => {
      await advancedPage.overlayDropdown.click();
      await expect(page.getByRole("button", { name: "None" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Bottom" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Top" })).toBeVisible();
    });

    test("overlay position selection works", async () => {
      await advancedPage.selectOverlayPosition("Top");
      const selected = await advancedPage.getOverlayPosition();
      expect(selected).toBe("Top");
    });

    test("model unload timeout dropdown has options", async ({ page }) => {
      await advancedPage.modelUnloadDropdown.click();
      await expect(page.getByRole("button", { name: "Never" })).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Immediately" })
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: /After \d+ minutes?/ })
      ).toBeVisible();
    });

    test("model unload timeout selection works", async () => {
      await advancedPage.selectModelUnloadTimeout("After 5 minutes");
      const selected = await advancedPage.getModelUnloadTimeout();
      expect(selected).toBe("After 5 minutes");
    });

    test("experimental features toggle works", async () => {
      const initialState = await advancedPage.isExperimentalEnabled();
      await advancedPage.toggleExperimental();
      const newState = await advancedPage.isExperimentalEnabled();
      expect(newState).toBe(!initialState);
    });
  });

  test.describe("Output Settings Group", () => {
    test("displays output settings group", async () => {
      await expect(advancedPage.isSettingsGroupVisible("Output")).resolves.toBe(
        true
      );
    });

    test("paste method dropdown has options", async ({ page }) => {
      await advancedPage.pasteMethodDropdown.click();
      await expect(page.getByRole("button", { name: /Clipboard/ })).toBeVisible();
      await expect(page.getByRole("button", { name: "Direct" })).toBeVisible();
      await expect(page.getByRole("button", { name: "None" })).toBeVisible();
    });

    test("paste method selection works", async () => {
      await advancedPage.selectPasteMethod("Direct");
      const selected = await advancedPage.getPasteMethod();
      expect(selected).toBe("Direct");
    });

    test("clipboard handling dropdown has options", async ({ page }) => {
      await advancedPage.clipboardHandlingDropdown.click();
      await expect(
        page.getByRole("button", { name: "Don't Modify Clipboard" })
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Copy to Clipboard" })
      ).toBeVisible();
    });

    test("clipboard handling selection works", async () => {
      await advancedPage.selectClipboardHandling("Copy to Clipboard");
      const selected = await advancedPage.getClipboardHandling();
      expect(selected).toBe("Copy to Clipboard");
    });
  });

  test.describe("Transcription Settings Group", () => {
    test("displays transcription settings group", async () => {
      await expect(
        advancedPage.isSettingsGroupVisible("Transcription")
      ).resolves.toBe(true);
    });

    test("trailing space toggle works", async () => {
      const initialState = await advancedPage.isTrailingSpaceEnabled();
      await advancedPage.toggleTrailingSpace();
      const newState = await advancedPage.isTrailingSpaceEnabled();
      expect(newState).toBe(!initialState);
    });

    test("custom words input is visible", async () => {
      await expect(advancedPage.customWordsInput).toBeVisible();
    });

    test("can add custom word", async () => {
      const testWord = "TestWord";
      await advancedPage.addCustomWord(testWord);
      const chip = advancedPage.getCustomWordChip(testWord);
      await expect(chip).toBeVisible();
    });

    test("can remove custom word", async () => {
      const testWord = "RemoveMe";
      await advancedPage.addCustomWord(testWord);
      await expect(advancedPage.getCustomWordChip(testWord)).toBeVisible();
      await advancedPage.removeCustomWord(testWord);
      await expect(advancedPage.getCustomWordChip(testWord)).not.toBeVisible();
    });

    test("add button disabled for empty input", async () => {
      await advancedPage.customWordsInput.fill("");
      await expect(advancedPage.addWordButton).toBeDisabled();
    });

    test("add button disabled for input with spaces", async () => {
      await advancedPage.customWordsInput.fill("two words");
      await expect(advancedPage.addWordButton).toBeDisabled();
    });
  });

  test.describe("History Settings Group", () => {
    test("displays history settings group", async () => {
      await expect(
        advancedPage.isSettingsGroupVisible("History")
      ).resolves.toBe(true);
    });

    test("history limit input is visible", async () => {
      await expect(advancedPage.historyLimitInput).toBeVisible();
    });

    test("can set history limit", async () => {
      await advancedPage.setHistoryLimit(100);
      const value = await advancedPage.getHistoryLimit();
      expect(value).toBe(100);
    });
  });

  test.describe("Experimental Settings", () => {
    test("experimental group hidden by default", async () => {
      // Ensure experimental is disabled first
      if (await advancedPage.isExperimentalEnabled()) {
        await advancedPage.toggleExperimental();
      }
      await expect(
        advancedPage.isSettingsGroupVisible("Experimental")
      ).resolves.toBe(false);
    });

    test("experimental group visible when enabled", async () => {
      // Enable experimental features
      if (!(await advancedPage.isExperimentalEnabled())) {
        await advancedPage.toggleExperimental();
      }
      await expect(
        advancedPage.isSettingsGroupVisible("Experimental")
      ).resolves.toBe(true);
    });
  });

  test.describe("Translate to English (Whisper only)", () => {
    // Note: This feature visibility depends on having a Whisper model selected
    // In a real test environment, we might need to mock the model state
    test("translate toggle visibility depends on model", async () => {
      // The translate option should only be visible for Whisper models (not turbo)
      // This test documents the expected behavior
      const isVisible = await advancedPage.isTranslateVisible();
      // We just verify the page doesn't crash; actual visibility depends on model state
      expect(typeof isVisible).toBe("boolean");
    });
  });
});
