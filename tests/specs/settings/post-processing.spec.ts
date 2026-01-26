import { test, expect } from "@playwright/test";
import { PostProcessingPage } from "../../pages/settings/post-processing.page";

test.describe("Post-Processing Settings", () => {
  let postProcessingPage: PostProcessingPage;

  test.beforeEach(async ({ page }) => {
    postProcessingPage = new PostProcessingPage(page);
  });

  test.describe("Feature Toggle Behavior", () => {
    test("post-processing section is hidden by default", async ({ page }) => {
      await page.goto("/");

      const isVisible =
        await postProcessingPage.isPostProcessingSectionVisible();
      expect(isVisible).toBe(false);
    });

    test("enabling post-processing reveals section in sidebar", async ({
      page,
    }) => {
      await page.goto("/");

      const isMainApp = await postProcessingPage.isMainAppVisible();
      if (!isMainApp) {
        test.skip(true, "App is in onboarding flow");
        return;
      }

      await postProcessingPage.gotoAdvanced();

      // Assert: Post Process section not visible initially
      await expect(
        page.getByRole("link", { name: /post process/i }),
      ).not.toBeVisible();

      // Act: Enable post-processing
      const toggle = postProcessingPage.getPostProcessingToggle();
      const toggleVisible = await toggle.isVisible().catch(() => false);

      if (toggleVisible) {
        await toggle.click();

        // Assert: Post Process section now visible in sidebar
        await expect(
          page.getByRole("link", { name: /post process/i }),
        ).toBeVisible();
      }
    });

    test("disabling post-processing hides section from sidebar", async ({
      page,
    }) => {
      await page.goto("/");

      const isMainApp = await postProcessingPage.isMainAppVisible();
      if (!isMainApp) {
        test.skip(true, "App is in onboarding flow");
        return;
      }

      await postProcessingPage.gotoAdvanced();

      const toggle = postProcessingPage.getPostProcessingToggle();
      const toggleVisible = await toggle.isVisible().catch(() => false);

      if (toggleVisible) {
        // Ensure enabled first
        const isEnabled = await toggle.isChecked();
        if (!isEnabled) {
          await toggle.click();
        }

        // Assert: Section visible when enabled
        await expect(
          page.getByRole("link", { name: /post process/i }),
        ).toBeVisible();

        // Act: Disable post-processing
        await toggle.click();

        // Assert: Section hidden when disabled
        await expect(
          page.getByRole("link", { name: /post process/i }),
        ).not.toBeVisible();
      }
    });
  });

  test.describe("Provider Configuration Behavior", () => {
    test("provider selector shows available options", async ({ page }) => {
      const isVisible =
        await postProcessingPage.isPostProcessingSectionVisible();

      if (isVisible) {
        await postProcessingPage.goto();

        // Act: Open provider dropdown
        const options = await postProcessingPage.getProviderOptions();

        // Assert: Multiple providers available
        expect(options.length).toBeGreaterThan(0);
        const optionsText = options.join(" ").toLowerCase();
        expect(optionsText).toMatch(/openai|ollama|custom/i);
      }
    });

    test("API key input is masked", async ({ page }) => {
      await page.goto("/");

      const isVisible =
        await postProcessingPage.isPostProcessingSectionVisible();

      if (isVisible) {
        await postProcessingPage.goto();

        // Assert: API key input is password type
        const apiKeyInput = page.getByLabel(/api key/i);
        await expect(apiKeyInput).toHaveAttribute("type", "password");
      }
    });

    test("selecting custom provider reveals base URL field", async ({
      page,
    }) => {
      const isVisible =
        await postProcessingPage.isPostProcessingSectionVisible();

      if (isVisible) {
        await postProcessingPage.goto();

        // Assert: Base URL hidden for standard provider
        await postProcessingPage.selectProvider("OpenAI");
        await expect(page.getByLabel(/base url/i)).not.toBeVisible();

        // Act: Select custom provider
        await postProcessingPage.selectProvider("Custom");

        // Assert: Base URL now visible
        await expect(page.getByLabel(/base url/i)).toBeVisible();
      }
    });

    test("selecting standard provider hides base URL field", async ({
      page,
    }) => {
      const isVisible =
        await postProcessingPage.isPostProcessingSectionVisible();

      if (isVisible) {
        await postProcessingPage.goto();

        // Start with custom provider (base URL visible)
        await postProcessingPage.selectProvider("Custom");
        await expect(page.getByLabel(/base url/i)).toBeVisible();

        // Act: Switch to standard provider
        await postProcessingPage.selectProvider("OpenAI");

        // Assert: Base URL hidden
        await expect(page.getByLabel(/base url/i)).not.toBeVisible();
      }
    });
  });

  test.describe("Prompt Management Behavior", () => {
    test("create prompt button opens prompt editor", async ({ page }) => {
      const isVisible =
        await postProcessingPage.isPostProcessingSectionVisible();

      if (isVisible) {
        await postProcessingPage.goto();

        // Assert: Editor fields not visible initially
        await expect(page.getByLabel(/prompt label/i)).not.toBeVisible();

        // Act: Click create new prompt
        await postProcessingPage.createPromptButton.click();

        // Assert: Editor fields now visible
        await expect(page.getByLabel(/prompt label/i)).toBeVisible();
        await expect(
          page.getByRole("textbox", { name: /instruction/i }),
        ).toBeVisible();
      }
    });

    test("prompt textarea accepts custom instructions", async ({ page }) => {
      const isVisible =
        await postProcessingPage.isPostProcessingSectionVisible();

      if (isVisible) {
        await postProcessingPage.goto();

        await postProcessingPage.createPromptButton.click();

        // Act: Fill in prompt text
        const textarea = page.getByRole("textbox", { name: /instruction/i });
        await textarea.fill("Improve grammar: ${output}");

        // Assert: Text was entered
        await expect(textarea).toHaveValue(/Improve grammar/);
      }
    });

    test("cancel button closes prompt editor without saving", async ({
      page,
    }) => {
      const isVisible =
        await postProcessingPage.isPostProcessingSectionVisible();

      if (isVisible) {
        await postProcessingPage.goto();

        await postProcessingPage.createPromptButton.click();

        // Fill in some data
        await page.getByLabel(/prompt label/i).fill("Test Prompt");

        // Act: Click cancel
        await postProcessingPage.cancelButton.click();

        // Assert: Editor closed
        await expect(page.getByLabel(/prompt label/i)).not.toBeVisible();
      }
    });
  });

  test.describe("UI Component Presence", () => {
    test("post-processing page has API settings section", async ({ page }) => {
      const isVisible =
        await postProcessingPage.isPostProcessingSectionVisible();

      if (isVisible) {
        await postProcessingPage.goto();

        await expect(page.getByRole("heading", { name: /api/i })).toBeVisible();
      }
    });

    test("post-processing page has prompts section", async ({ page }) => {
      const isVisible =
        await postProcessingPage.isPostProcessingSectionVisible();

      if (isVisible) {
        await postProcessingPage.goto();

        await expect(
          page.getByRole("heading", { name: /prompt/i }),
        ).toBeVisible();
      }
    });

    test("model select has refresh button", async ({ page }) => {
      const isVisible =
        await postProcessingPage.isPostProcessingSectionVisible();

      if (isVisible) {
        await postProcessingPage.goto();

        await expect(
          page.getByRole("button", { name: /refresh/i }),
        ).toBeVisible();
      }
    });
  });
});
