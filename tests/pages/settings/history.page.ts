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
    this.historyContainer = page.locator(".max-w-3xl").first();
    this.emptyState = page.getByText(
      /no transcriptions yet|start recording to build your history/i
    );
    this.loadingState = page.getByText(/loading history/i);
    this.entryList = page.locator(".divide-y");
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
    const entries = this.entryList.locator("> div");
    return entries.count();
  }

  getEntry(index: number): HistoryEntryLocator {
    const entry = this.entryList.locator("> div").nth(index);
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
  readonly saveButton: Locator;
  readonly deleteButton: Locator;
  readonly audioPlayer: Locator;
  readonly playPauseButton: Locator;
  readonly progressSlider: Locator;

  constructor(container: Locator, page: Page) {
    this.container = container;
    this.page = page;
    this.timestamp = container.locator("p.font-medium").first();
    this.transcriptionText = container.locator("p.italic").first();
    this.copyButton = container.getByTitle(/copy transcription to clipboard/i);
    this.saveButton = container.locator('button:has(svg.lucide-star)');
    this.deleteButton = container.getByTitle(/delete entry/i);
    this.audioPlayer = container.locator("audio").locator("..");
    this.playPauseButton = container.getByRole("button", {
      name: /play|pause/i,
    });
    this.progressSlider = container.locator('input[type="range"]');
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
    // Check if the star icon has fill (saved state)
    const svg = this.saveButton.locator("svg");
    const fill = await svg.getAttribute("fill");
    return fill === "currentColor";
  }

  async hasAudioPlayer(): Promise<boolean> {
    return this.playPauseButton.isVisible();
  }

  async clickPlayPause(): Promise<void> {
    await this.playPauseButton.click();
  }

  async isPlaying(): Promise<boolean> {
    // Check for pause button (indicates playing)
    const ariaLabel = await this.playPauseButton.getAttribute("aria-label");
    return ariaLabel === "Pause";
  }
}
