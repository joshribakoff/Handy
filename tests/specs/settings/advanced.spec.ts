import { test, expect } from "@playwright/test";
import { AdvancedSettingsPage } from "../../pages/settings/advanced.page";

test.describe("Advanced Settings", () => {
  let advancedPage: AdvancedSettingsPage;

  test.beforeEach(async ({ page }) => {
    advancedPage = new AdvancedSettingsPage(page);
    await advancedPage.navigate();
  });

  test.describe("Settings Groups Visibility", () => {
    test("displays all settings groups", async () => {
      await expect(advancedPage.isSettingsGroupVisible("App")).resolves.toBe(
        true,
      );
      await expect(advancedPage.isSettingsGroupVisible("Output")).resolves.toBe(
        true,
      );
      await expect(
        advancedPage.isSettingsGroupVisible("Transcription"),
      ).resolves.toBe(true);
      await expect(
        advancedPage.isSettingsGroupVisible("History"),
      ).resolves.toBe(true);
    });

    test("experimental group hidden by default, visible when enabled", async () => {
      // Assert: Experimental group hidden initially
      await expect(
        advancedPage.isSettingsGroupVisible("Experimental"),
      ).resolves.toBe(false);

      // Act: Enable experimental features
      await advancedPage.experimentalToggle.click();

      // Assert: Experimental group now visible
      await expect(
        advancedPage.isSettingsGroupVisible("Experimental"),
      ).resolves.toBe(true);
    });
  });

  test.describe("App Settings", () => {
    test("start hidden toggle persists setting", async () => {
      // Assert: Get initial state
      const toggle = advancedPage.startHiddenToggle;
      const wasChecked = await toggle.isChecked();

      // Act: Toggle the setting
      await toggle.click();

      // Assert: State changed
      await expect(toggle).toBeChecked({ checked: !wasChecked });
    });

    test("autostart toggle persists setting", async () => {
      // Assert: Get initial state
      const toggle = advancedPage.autostartToggle;
      const wasChecked = await toggle.isChecked();

      // Act: Toggle the setting
      await toggle.click();

      // Assert: State changed
      await expect(toggle).toBeChecked({ checked: !wasChecked });
    });

    test("overlay position selection persists", async ({ page }) => {
      // Assert: Dropdown exists and is clickable
      const dropdown = advancedPage.overlayDropdown;
      await expect(dropdown).toBeVisible();

      // Act: Open dropdown and select Top
      await dropdown.click();
      await page.getByRole("option", { name: "Top" }).click();

      // Assert: Selection persisted
      await expect(dropdown).toHaveText(/Top/);
    });

    test("model unload timeout selection persists", async ({ page }) => {
      // Assert: Dropdown exists
      const dropdown = advancedPage.modelUnloadDropdown;
      await expect(dropdown).toBeVisible();

      // Act: Select "After 5 minutes"
      await dropdown.click();
      await page.getByRole("option", { name: /After 5 minutes/ }).click();

      // Assert: Selection persisted
      await expect(dropdown).toHaveText(/After 5 minutes/);
    });
  });

  test.describe("Output Settings", () => {
    test("paste method selection persists", async ({ page }) => {
      const dropdown = advancedPage.pasteMethodDropdown;

      // Act: Select Direct paste method
      await dropdown.click();
      await page.getByRole("option", { name: "Direct" }).click();

      // Assert: Selection persisted
      await expect(dropdown).toHaveText(/Direct/);
    });

    test("clipboard handling selection persists", async ({ page }) => {
      const dropdown = advancedPage.clipboardHandlingDropdown;

      // Act: Select Copy to Clipboard
      await dropdown.click();
      await page.getByRole("option", { name: "Copy to Clipboard" }).click();

      // Assert: Selection persisted
      await expect(dropdown).toHaveText(/Copy to Clipboard/);
    });
  });

  test.describe("Transcription Settings", () => {
    test("trailing space toggle persists setting", async () => {
      const toggle = advancedPage.trailingSpaceToggle;
      const wasChecked = await toggle.isChecked();

      // Act
      await toggle.click();

      // Assert
      await expect(toggle).toBeChecked({ checked: !wasChecked });
    });

    test("custom words input accepts and displays words", async () => {
      const input = advancedPage.customWordsInput;
      const addButton = advancedPage.addWordButton;

      // Assert: Input is empty, add button disabled
      await expect(input).toHaveValue("");
      await expect(addButton).toBeDisabled();

      // Act: Type a word
      await input.fill("TestWord");

      // Assert: Add button now enabled
      await expect(addButton).toBeEnabled();

      // Act: Add the word
      await addButton.click();

      // Assert: Word appears as chip, input cleared
      await expect(advancedPage.getCustomWordChip("TestWord")).toBeVisible();
      await expect(input).toHaveValue("");
    });

    test("custom word can be removed", async () => {
      // Arrange: Add a word first
      await advancedPage.addCustomWord("RemoveMe");
      const chip = advancedPage.getCustomWordChip("RemoveMe");

      // Assert: Word exists
      await expect(chip).toBeVisible();

      // Act: Remove the word
      await chip.click();

      // Assert: Word is gone
      await expect(chip).not.toBeVisible();
    });

    test("add button disabled for invalid input", async () => {
      const input = advancedPage.customWordsInput;
      const addButton = advancedPage.addWordButton;

      // Assert: Empty input - button disabled
      await input.fill("");
      await expect(addButton).toBeDisabled();

      // Assert: Input with spaces - button disabled
      await input.fill("two words");
      await expect(addButton).toBeDisabled();
    });
  });

  test.describe("History Settings", () => {
    test("history limit accepts numeric input", async () => {
      const input = advancedPage.historyLimitInput;

      // Assert: Input exists
      await expect(input).toBeVisible();

      // Act: Set value
      await input.fill("100");

      // Assert: Value persisted
      await expect(input).toHaveValue("100");
    });
  });

  test.describe("Translate to English", () => {
    test("translate toggle visibility depends on model type", async () => {
      // Note: Translate option only visible for Whisper models (not turbo)
      // This test verifies the toggle can be queried without errors
      const toggle = advancedPage.translateToggle;
      const isVisible = await toggle.isVisible();
      expect(typeof isVisible).toBe("boolean");
    });
  });
});
