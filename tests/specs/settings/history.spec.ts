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

    test("open recordings folder button is visible and clickable", async ({
      page,
    }) => {
      const historyPage = new HistoryPage(page);
      await historyPage.navigate();
      await historyPage.waitForHistoryLoaded();

      await expect(historyPage.openFolderButton).toBeVisible();
      await expect(historyPage.openFolderButton).toBeEnabled();
      // Click should not throw (mocked command returns null)
      await historyPage.clickOpenFolder();
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

    test("entry has action buttons (copy, save, delete)", async ({ page }) => {
      const historyPage = new HistoryPage(page);
      await historyPage.navigate();
      await historyPage.waitForHistoryLoaded();

      const entry = historyPage.getEntry(0);
      await expect(entry.copyButton).toBeVisible();
      await expect(entry.saveButton).toBeVisible();
      await expect(entry.deleteButton).toBeVisible();
    });

    test("copy button shows checkmark feedback after click", async ({
      page,
    }) => {
      const historyPage = new HistoryPage(page);
      await historyPage.navigate();
      await historyPage.waitForHistoryLoaded();

      const entry = historyPage.getEntry(0);

      // Click copy
      await entry.clickCopy();

      // Check for the checkmark icon (feedback that copy happened)
      const checkIcon = entry.container.locator("svg.lucide-check");
      await expect(checkIcon).toBeVisible({ timeout: 2000 });
    });

    test("save button is visible and clickable", async ({ page }) => {
      const historyPage = new HistoryPage(page);
      await historyPage.navigate();
      await historyPage.waitForHistoryLoaded();

      const entry = historyPage.getEntry(0);
      await expect(entry.saveButton).toBeVisible();
      await expect(entry.saveButton).toBeEnabled();

      // Click should not throw
      await entry.clickSave();
    });

    test("delete button is present and clickable", async ({ page }) => {
      const historyPage = new HistoryPage(page);
      await historyPage.navigate();
      await historyPage.waitForHistoryLoaded();

      const entry = historyPage.getEntry(0);
      await expect(entry.deleteButton).toBeVisible();
      await expect(entry.deleteButton).toBeEnabled();
    });

    test("history container is visible", async ({ page }) => {
      const historyPage = new HistoryPage(page);
      await historyPage.navigate();
      await historyPage.waitForHistoryLoaded();

      await expect(historyPage.historyContainer).toBeVisible();
    });

    test("multiple entries render correctly", async ({ page }) => {
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
