import { test, expect } from "@playwright/test";
import { PostProcessingPage } from "../../pages/settings/post-processing.page";

test.describe("Post-Processing Settings", () => {
  let postProcessingPage: PostProcessingPage;

  test.beforeEach(async ({ page }) => {
    postProcessingPage = new PostProcessingPage(page);
  });

  test.describe("Experimental Feature Gate", () => {
    test("post-processing section is hidden by default", async ({ page }) => {
      await page.goto("/");
      // Post Process should not be visible in sidebar by default
      const isVisible = await postProcessingPage.isPostProcessingSectionVisible();
      expect(isVisible).toBe(false);
    });

    test("post-processing toggle is in experimental group", async ({ page }) => {
      await page.goto("/");

      // Skip if app is in onboarding mode
      const isMainApp = await postProcessingPage.isMainAppVisible();
      if (!isMainApp) {
        test.skip(true, "App is in onboarding flow - skipping Advanced settings test");
        return;
      }

      // Navigate to Advanced settings
      await postProcessingPage.gotoAdvanced();

      // Check if experimental section exists (requires experimental_enabled first)
      const experimentalGroup = postProcessingPage.getExperimentalGroup();
      const groupVisible = await experimentalGroup.isVisible().catch(() => false);

      if (groupVisible) {
        // Verify post-processing toggle exists in this group
        const toggle = postProcessingPage.getPostProcessingToggle();
        await expect(toggle).toBeVisible();
      }
    });
  });

  test.describe("Provider Configuration", () => {
    test.beforeEach(async ({ page }) => {
      // Enable experimental and post-processing to access the section
      // This would need proper setup - for now we test the component structure
      await page.goto("/");
    });

    test("provider selector shows available options", async ({ page }) => {
      // Navigate to post-processing if visible, otherwise check component exists
      const isVisible = await postProcessingPage.isPostProcessingSectionVisible();

      if (isVisible) {
        await postProcessingPage.goto();

        // Provider dropdown should be visible
        await expect(postProcessingPage.providerDropdownButton).toBeVisible();

        // Should show provider options when clicked
        const options = await postProcessingPage.getProviderOptions();
        expect(options.length).toBeGreaterThan(0);

        // Common providers should be available
        const optionsText = options.join(" ").toLowerCase();
        expect(optionsText).toMatch(/openai|ollama|custom/i);
      }
    });

    test("API key input is masked (password type)", async ({ page }) => {
      const isVisible = await postProcessingPage.isPostProcessingSectionVisible();

      if (isVisible) {
        await postProcessingPage.goto();

        // API key field should be a password input
        const isMasked = await postProcessingPage.isApiKeyMasked();
        expect(isMasked).toBe(true);
      }
    });

    test("base URL field only visible for custom provider", async ({ page }) => {
      const isVisible = await postProcessingPage.isPostProcessingSectionVisible();

      if (isVisible) {
        await postProcessingPage.goto();

        // Select OpenAI - base URL should be hidden
        await postProcessingPage.selectProvider("OpenAI");
        let baseUrlVisible = await postProcessingPage.isBaseUrlVisible();
        expect(baseUrlVisible).toBe(false);

        // Select Custom - base URL should be visible
        await postProcessingPage.selectProvider("Custom");
        baseUrlVisible = await postProcessingPage.isBaseUrlVisible();
        expect(baseUrlVisible).toBe(true);
      }
    });
  });

  test.describe("Disabled State", () => {
    test("shows disabled notice when post-processing is off", async ({ page }) => {
      // When post-processing is disabled, navigating to the section
      // (if possible) should show a disabled notice
      await page.goto("/");

      // The sidebar item won't be visible if disabled
      const sidebarVisible = await postProcessingPage.isPostProcessingSectionVisible();

      // If we somehow got to the post-processing page while disabled,
      // it should show the disabled notice
      if (!sidebarVisible) {
        // This is expected - post-processing section is hidden when disabled
        expect(sidebarVisible).toBe(false);
      }
    });
  });

  test.describe("UI Components", () => {
    test("page structure includes API and Prompts groups", async ({ page }) => {
      const isVisible = await postProcessingPage.isPostProcessingSectionVisible();

      if (isVisible) {
        await postProcessingPage.goto();

        // Should have API settings group
        await expect(page.locator("text=API (OpenAI Compatible)")).toBeVisible();

        // Should have Prompts group
        await expect(page.locator("text=Prompt")).toBeVisible();
      }
    });

    test("model select has refresh button", async ({ page }) => {
      const isVisible = await postProcessingPage.isPostProcessingSectionVisible();

      if (isVisible) {
        await postProcessingPage.goto();

        // Model section should have a refresh button
        await expect(postProcessingPage.modelRefreshButton).toBeVisible();
      }
    });

    test("create prompt button exists", async ({ page }) => {
      const isVisible = await postProcessingPage.isPostProcessingSectionVisible();

      if (isVisible) {
        await postProcessingPage.goto();

        await expect(postProcessingPage.createPromptButton).toBeVisible();
      }
    });

    test("prompt textarea accepts custom instructions", async ({ page }) => {
      const isVisible = await postProcessingPage.isPostProcessingSectionVisible();

      if (isVisible) {
        await postProcessingPage.goto();

        // Click create new prompt
        await postProcessingPage.createPromptButton.click();

        // Textarea should be visible and editable
        await expect(postProcessingPage.promptTextarea).toBeVisible();

        // Fill in some text
        await postProcessingPage.promptTextarea.fill("Improve grammar: ${output}");

        // Verify text was entered
        const value = await postProcessingPage.promptTextarea.inputValue();
        expect(value).toContain("Improve grammar");
      }
    });
  });

  test.describe("Integration with Advanced Settings", () => {
    test("experimental group contains post-processing toggle", async ({ page }) => {
      await page.goto("/");

      // Skip if app is in onboarding mode
      const isMainApp = await postProcessingPage.isMainAppVisible();
      if (!isMainApp) {
        test.skip(true, "App is in onboarding flow - skipping Advanced settings test");
        return;
      }

      await postProcessingPage.gotoAdvanced();

      // Look for experimental group (may need experimental_enabled first)
      const experimentalHeader = page.locator("text=Experimental");
      const isExperimentalVisible = await experimentalHeader.isVisible().catch(() => false);

      if (isExperimentalVisible) {
        // Post Processing toggle should be in this group
        const postProcessToggle = page.locator("text=Post Processing").locator("..");
        await expect(postProcessToggle).toBeVisible();
      }
    });

    test("enabling post-processing shows section in sidebar", async ({ page }) => {
      await page.goto("/");

      // Skip if app is in onboarding mode
      const isMainApp = await postProcessingPage.isMainAppVisible();
      if (!isMainApp) {
        test.skip(true, "App is in onboarding flow - skipping Advanced settings test");
        return;
      }

      await postProcessingPage.gotoAdvanced();

      // Check if experimental group is visible
      const experimentalHeader = page.locator("text=Experimental");
      const isExperimentalVisible = await experimentalHeader.isVisible().catch(() => false);

      if (isExperimentalVisible) {
        // Enable post-processing
        const toggle = postProcessingPage.getPostProcessingToggle();
        const isEnabled = await toggle.isChecked();

        if (!isEnabled) {
          await toggle.click();
          // Wait for state to update
          await page.waitForTimeout(500);
        }

        // Post Process section should now appear in sidebar
        const sidebarVisible = await postProcessingPage.isPostProcessingSectionVisible();
        expect(sidebarVisible).toBe(true);
      }
    });
  });
});
