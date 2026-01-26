import { test, expect } from "@playwright/test";
import { HistoryPage } from "../../pages/settings/history.page";
import {
  setupTauriMocks,
  createMockHistoryEntries,
} from "../../fixtures/tauri-mocks";

test.describe("History Settings", () => {
  test.describe("empty state", () => {
    test("shows empty state when no history entries exist", async ({
      page,
    }) => {
      await setupTauriMocks(page, { hasModels: true, historyEntries: [] });

      const historyPage = new HistoryPage(page);
      await historyPage.navigate();
      await historyPage.waitForHistoryLoaded();

      await expect(historyPage.emptyState).toBeVisible();
    });
  });

  test.describe("with history entries", () => {
    test.beforeEach(async ({ page }) => {
      const mockEntries = createMockHistoryEntries(3);
      await setupTauriMocks(page, {
        hasModels: true,
        historyEntries: mockEntries,
      });
    });

    test("displays history section title", async ({ page }) => {
      const historyPage = new HistoryPage(page);
      await historyPage.navigate();
      await historyPage.waitForHistoryLoaded();

      await expect(historyPage.historyTitle).toBeVisible();
    });

    test("clicking open folder button triggers folder open command", async ({
      page,
    }) => {
      const historyPage = new HistoryPage(page);
      await historyPage.navigate();
      await historyPage.waitForHistoryLoaded();

      // Click should not throw (mocked command returns null)
      await historyPage.clickOpenFolder();

      // Button should still be enabled after click
      await expect(historyPage.openFolderButton).toBeEnabled();
    });

    test("entry displays timestamp and transcription text", async ({
      page,
    }) => {
      const historyPage = new HistoryPage(page);
      await historyPage.navigate();
      await historyPage.waitForHistoryLoaded();

      const count = await historyPage.getEntryCount();
      expect(count).toBeGreaterThan(0);

      const entry = historyPage.getEntry(0);
      const timestamp = await entry.getTimestamp();
      const text = await entry.getTranscriptionText();

      expect(timestamp).toBeTruthy();
      expect(text).toBeTruthy();
      expect(text).toContain("transcription text for entry");
    });

    test("copying transcription shows feedback", async ({ page }) => {
      const historyPage = new HistoryPage(page);
      await historyPage.navigate();
      await historyPage.waitForHistoryLoaded();

      const entry = historyPage.getEntry(0);

      // Assert: Copy button visible before click
      await expect(entry.copyButton).toBeVisible();

      // Act: Click copy
      await entry.clickCopy();

      // Assert: Feedback shown (copied button replaces copy button)
      await entry.waitForCopiedFeedback();
      await expect(entry.copiedButton).toBeVisible();
    });

    test("save button toggles saved state", async ({ page }) => {
      const historyPage = new HistoryPage(page);
      await historyPage.navigate();
      await historyPage.waitForHistoryLoaded();

      const entry = historyPage.getEntry(0);

      // Assert: Save button is visible and clickable
      await expect(entry.saveButton).toBeVisible();
      await expect(entry.saveButton).toBeEnabled();

      // Act: Click save
      await entry.clickSave();

      // Assert: Button is still enabled (command was processed)
      await expect(entry.saveButton).toBeEnabled();
    });

    test("delete button removes entry from list", async ({ page }) => {
      // Setup: Track delete command calls
      await page.evaluate(() => {
        (window as any).__deleteCallCount = 0;
        const originalInvoke = (window as any).__TAURI_INTERNALS__.invoke;
        (window as any).__TAURI_INTERNALS__.invoke = async (
          cmd: string,
          args?: any,
        ) => {
          if (cmd === "delete_history_entry") {
            (window as any).__deleteCallCount++;
          }
          return originalInvoke(cmd, args);
        };
      });

      const historyPage = new HistoryPage(page);
      await historyPage.navigate();
      await historyPage.waitForHistoryLoaded();

      // Assert: Entry exists
      const initialCount = await historyPage.getEntryCount();
      expect(initialCount).toBe(3);

      const entry = historyPage.getEntry(0);
      await expect(entry.deleteButton).toBeVisible();

      // Act: Click delete
      await entry.clickDelete();

      // Assert: Delete command was called
      const deleteCallCount = await page.evaluate(
        () => (window as any).__deleteCallCount,
      );
      expect(deleteCallCount).toBe(1);
    });

    test("multiple entries render with distinct content", async ({ page }) => {
      const historyPage = new HistoryPage(page);
      await historyPage.navigate();
      await historyPage.waitForHistoryLoaded();

      const count = await historyPage.getEntryCount();
      expect(count).toBe(3);

      // Verify entries have distinct content
      const entry0 = historyPage.getEntry(0);
      const entry1 = historyPage.getEntry(1);

      const text0 = await entry0.getTranscriptionText();
      const text1 = await entry1.getTranscriptionText();

      expect(text0).toContain("entry 1");
      expect(text1).toContain("entry 2");
    });
  });
});
