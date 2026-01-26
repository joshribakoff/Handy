import { Locator } from "@playwright/test";
import { BasePage } from "./base.page";

/**
 * Sidebar section identifiers matching SECTIONS_CONFIG keys.
 */
export type SidebarSection =
  | "general"
  | "advanced"
  | "postprocessing"
  | "history"
  | "debug"
  | "about";

/**
 * Sidebar section labels (English translations).
 */
export const SECTION_LABELS: Record<SidebarSection, string> = {
  general: "General",
  advanced: "Advanced",
  postprocessing: "Post Process",
  history: "History",
  debug: "Debug",
  about: "About",
};

/**
 * All sections that are always visible (not gated by settings).
 */
export const ALWAYS_VISIBLE_SECTIONS: SidebarSection[] = [
  "general",
  "advanced",
  "history",
  "about",
];

/**
 * Sections gated by settings.
 */
export const CONDITIONAL_SECTIONS: SidebarSection[] = [
  "postprocessing", // requires post_process_enabled
  "debug", // requires debug_mode
];

/**
 * Page object for sidebar navigation.
 */
export class SidebarPage extends BasePage {
  /**
   * Get the sidebar navigation element.
   */
  get container(): Locator {
    return this.page.getByRole("navigation");
  }

  /**
   * Get the logo element.
   */
  get logo(): Locator {
    return this.page.getByRole("img", { name: /logo/i });
  }

  /**
   * Get a section item by its label text.
   * Note: Sidebar items are div elements with text, not button elements.
   */
  getSectionByLabel(label: string): Locator {
    return this.page.getByText(label, { exact: true }).first();
  }

  /**
   * Get a section item by section ID.
   */
  getSection(section: SidebarSection): Locator {
    return this.getSectionByLabel(SECTION_LABELS[section]);
  }

  /**
   * Click a section to navigate.
   */
  async clickSection(section: SidebarSection): Promise<void> {
    await this.getSection(section).click();
  }

  /**
   * Check if a section is currently active by checking aria-pressed.
   */
  async isSectionActive(section: SidebarSection): Promise<boolean> {
    const sectionEl = this.getSection(section);
    const pressed = await sectionEl.getAttribute("aria-pressed");
    return pressed === "true";
  }

  /**
   * Get the currently active section.
   */
  async getActiveSection(): Promise<SidebarSection | null> {
    for (const section of [
      ...ALWAYS_VISIBLE_SECTIONS,
      ...CONDITIONAL_SECTIONS,
    ]) {
      const sectionEl = this.getSection(section);
      const isVisible = await sectionEl.isVisible().catch(() => false);
      if (isVisible && (await this.isSectionActive(section))) {
        return section;
      }
    }
    return null;
  }

  /**
   * Get count of visible sections.
   */
  async getVisibleSectionCount(): Promise<number> {
    let count = 0;
    for (const section of [
      ...ALWAYS_VISIBLE_SECTIONS,
      ...CONDITIONAL_SECTIONS,
    ]) {
      const isVisible = await this.getSection(section)
        .isVisible()
        .catch(() => false);
      if (isVisible) count++;
    }
    return count;
  }

  /**
   * Get all visible section labels.
   */
  async getVisibleSectionLabels(): Promise<string[]> {
    const labels: string[] = [];
    for (const section of [
      ...ALWAYS_VISIBLE_SECTIONS,
      ...CONDITIONAL_SECTIONS,
    ]) {
      const sectionEl = this.getSection(section);
      const isVisible = await sectionEl.isVisible().catch(() => false);
      if (isVisible) {
        labels.push(SECTION_LABELS[section]);
      }
    }
    return labels;
  }

  /**
   * Check if section is visible in sidebar.
   */
  async isSectionVisible(section: SidebarSection): Promise<boolean> {
    return this.getSection(section).isVisible();
  }

  /** Convenience method to navigate to History */
  async navigateToHistory(): Promise<void> {
    await this.clickSection("history");
  }

  /** Convenience method to navigate to General */
  async navigateToGeneral(): Promise<void> {
    await this.clickSection("general");
  }

  /** Convenience method to navigate to Advanced */
  async navigateToAdvanced(): Promise<void> {
    await this.clickSection("advanced");
  }

  /** Convenience method to navigate to About */
  async navigateToAbout(): Promise<void> {
    await this.clickSection("about");
  }

  /** Convenience method to navigate to Debug */
  async navigateToDebug(): Promise<void> {
    await this.clickSection("debug");
  }

  /** Convenience method to navigate to Post Process */
  async navigateToPostProcess(): Promise<void> {
    await this.clickSection("postprocessing");
  }
}
