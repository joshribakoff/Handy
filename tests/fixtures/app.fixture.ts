import { test as base } from "@playwright/test";
import { SidebarPage } from "../pages/sidebar.page";
import { getTauriMockScript, TauriMockConfig } from "./tauri-mock";

/**
 * Extended test fixture with Tauri mocks and page objects.
 */
export const test = base.extend<{
  tauriConfig: TauriMockConfig;
  sidebar: SidebarPage;
}>({
  // Default config: skip onboarding, show main settings
  tauriConfig: [{}, { option: true }],

  sidebar: async ({ page, tauriConfig }, use) => {
    // Inject Tauri mocks before page loads
    await page.addInitScript(getTauriMockScript(tauriConfig));
    await page.goto("/");

    // Wait for app to be ready (sidebar should be visible)
    const sidebar = new SidebarPage(page);
    await sidebar.container.waitFor({ state: "visible", timeout: 10000 });

    await use(sidebar);
  },
});

export { expect } from "@playwright/test";
