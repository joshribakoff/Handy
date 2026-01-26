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
   * Get the sidebar container.
   */
  get container(): Locator {
    // Sidebar is the first child div with border-r class
    return this.page.locator("div.border-r").first();
  }

  /**
   * Get the logo element.
   */
  get logo(): Locator {
    return this.container.locator("svg").first();
  }

  /**
   * Get a section item by its label text.
   */
  getSectionByLabel(label: string): Locator {
    return this.container.locator("div.cursor-pointer").filter({ hasText: label });
  }

  /**
   * Get a section item by section ID.
   */
  getSection(section: SidebarSection): Locator {
    return this.getSectionByLabel(SECTION_LABELS[section]);
  }

  /**
   * Get all visible section items.
   */
  get allSections(): Locator {
    return this.container.locator("div.cursor-pointer");
  }

  /**
   * Click a section to navigate.
   */
  async clickSection(section: SidebarSection): Promise<void> {
    await this.getSection(section).click();
  }

  /**
   * Check if a section is currently active (highlighted).
   */
  async isSectionActive(section: SidebarSection): Promise<boolean> {
    const sectionEl = this.getSection(section);
    const classes = await sectionEl.getAttribute("class");
    // Active sections have bg-logo-primary/80 class
    return classes?.includes("bg-logo-primary") ?? false;
  }

  /**
   * Get the currently active section.
   */
  async getActiveSection(): Promise<SidebarSection | null> {
    for (const section of ALWAYS_VISIBLE_SECTIONS) {
      if (await this.isSectionActive(section)) {
        return section;
      }
    }
    // Also check conditional sections
    for (const section of CONDITIONAL_SECTIONS) {
      const sectionEl = this.getSection(section);
      if (await sectionEl.isVisible().catch(() => false)) {
        if (await this.isSectionActive(section)) {
          return section;
        }
      }
    }
    return null;
  }

  /**
   * Get count of visible sections.
   */
  async getVisibleSectionCount(): Promise<number> {
    return this.allSections.count();
  }

  /**
   * Get all visible section labels.
   */
  async getVisibleSectionLabels(): Promise<string[]> {
    const sections = this.allSections;
    const count = await sections.count();
    const labels: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await sections.nth(i).locator("p").textContent();
      if (text) labels.push(text);
    }
    return labels;
  }

  /**
   * Check if section is visible in sidebar.
   */
  async isSectionVisible(section: SidebarSection): Promise<boolean> {
    return this.getSection(section).isVisible();
  }
}
