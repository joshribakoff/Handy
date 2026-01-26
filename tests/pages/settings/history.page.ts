import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";
import { SidebarPage } from "../sidebar.page";

export class HistoryPage extends BasePage {
  readonly sidebar: SidebarPage;
  readonly historyTitle: Locator;
  readonly openFolderButton: Locator;
  readonly historyContainer: Locator;
  readonly emptyState: Locator;
  readonly loadingState: Locator;
  readonly entryList: Locator;

  constructor(page: Page) {
    super(page);
    this.sidebar = new SidebarPage(page);
    this.historyTitle = page.getByRole("heading", { name: /history/i });
    this.openFolderButton = page.getByRole("button", {
      name: /open recordings folder/i,
    });
    this.historyContainer = page.getByRole("region", { name: /history/i });
    this.emptyState = page.getByText(
      /no transcriptions yet|start recording to build your history/i,
    );
    this.loadingState = page.getByText(/loading history/i);
    this.entryList = page.getByRole("list", { name: /history entries/i });
  }

  async navigate(): Promise<void> {
    await this.goto();
    await this.waitForLoad();
    await this.sidebar.navigateToHistory();
  }

  async waitForHistoryLoaded(): Promise<void> {
    // Wait for loading state to disappear
    await expect(this.loadingState).toBeHidden({ timeout: 10000 });
  }

  async getEntryCount(): Promise<number> {
    const entries = this.entryList.getByRole("listitem");
    return entries.count();
  }

  getEntry(index: number): HistoryEntryLocator {
    const entry = this.entryList.getByRole("listitem").nth(index);
    return new HistoryEntryLocator(entry, this.page);
  }

  async isEmptyStateVisible(): Promise<boolean> {
    return this.emptyState.isVisible();
  }

  async clickOpenFolder(): Promise<void> {
    await this.openFolderButton.click();
  }
}

export class HistoryEntryLocator {
  readonly container: Locator;
  readonly page: Page;
  readonly timestamp: Locator;
  readonly transcriptionText: Locator;
  readonly copyButton: Locator;
  readonly copiedButton: Locator;
  readonly saveButton: Locator;
  readonly deleteButton: Locator;
  readonly audioPlayer: Locator;
  readonly playPauseButton: Locator;
  readonly progressSlider: Locator;

  constructor(container: Locator, page: Page) {
    this.container = container;
    this.page = page;
    this.timestamp = container.getByRole("time");
    this.transcriptionText = container.getByRole("paragraph");
    this.copyButton = container.getByRole("button", {
      name: /copy transcription/i,
    });
    this.copiedButton = container.getByRole("button", { name: /copied/i });
    this.saveButton = container.getByRole("button", { name: /save|unsave/i });
    this.deleteButton = container.getByRole("button", { name: /delete/i });
    this.audioPlayer = container.getByRole("region", { name: /audio player/i });
    this.playPauseButton = container.getByRole("button", {
      name: /play|pause/i,
    });
    this.progressSlider = container.getByRole("slider");
  }

  async getTimestamp(): Promise<string> {
    return (await this.timestamp.textContent()) ?? "";
  }

  async getTranscriptionText(): Promise<string> {
    return (await this.transcriptionText.textContent()) ?? "";
  }

  async clickCopy(): Promise<void> {
    await this.copyButton.click();
  }

  async clickSave(): Promise<void> {
    await this.saveButton.click();
  }

  async clickDelete(): Promise<void> {
    await this.deleteButton.click();
  }

  async isSaved(): Promise<boolean> {
    // Check if button has "unsave" accessible name (indicates saved state)
    const name = await this.saveButton.getAttribute("aria-label");
    return name?.toLowerCase().includes("unsave") ?? false;
  }

  async hasAudioPlayer(): Promise<boolean> {
    return this.playPauseButton.isVisible();
  }

  async clickPlayPause(): Promise<void> {
    await this.playPauseButton.click();
  }

  async isPlaying(): Promise<boolean> {
    // Check for pause button (indicates playing)
    const name = await this.playPauseButton.getAttribute("aria-label");
    return name?.toLowerCase() === "pause";
  }

  async waitForCopiedFeedback(): Promise<void> {
    await this.copiedButton.waitFor({ state: "visible", timeout: 2000 });
  }
}
