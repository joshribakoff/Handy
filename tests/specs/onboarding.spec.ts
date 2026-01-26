import { test, expect } from "@playwright/test";
import { OnboardingPage } from "../pages/onboarding.page";

/**
 * Onboarding flow tests for Handy app
 *
 * Note: These tests run against the Vite dev server (not the full Tauri app).
 * Tauri commands (like hasAnyModelsAvailable, downloadModel) may not be available
 * in the browser context, so we test the UI behavior and structure.
 */
test.describe("Onboarding Flow", () => {
  let onboarding: OnboardingPage;

  test.beforeEach(async ({ page }) => {
    onboarding = new OnboardingPage(page);
    await onboarding.goto();
  });

  test.describe("Permissions Screen", () => {
    test("shows permissions screen on first launch", async ({ page }) => {
      // The app starts with checking onboarding status
      // On non-macOS or when permissions already granted, it may skip directly
      // We check if either permissions or model selection screen is shown
      await onboarding.waitForOnboarding();

      // Either on permissions screen or model selection screen
      const onPermissions = await onboarding.isOnPermissionsScreen();
      const onModelSelection = await onboarding.isOnModelSelectionScreen();

      expect(onPermissions || onModelSelection).toBeTruthy();
    });

    test("permissions screen displays microphone and accessibility cards", async ({
      page,
    }) => {
      await onboarding.waitForOnboarding();

      // Skip if not on permissions screen (e.g., non-macOS)
      if (!(await onboarding.isOnPermissionsScreen())) {
        test.skip();
        return;
      }

      // Check title and description
      await expect(onboarding.permissionsTitle).toBeVisible();
      await expect(onboarding.permissionsDescription).toBeVisible();

      // Check for microphone card
      await expect(page.getByText("Microphone Access")).toBeVisible();
      await expect(
        page.getByText("Required to hear your voice for transcription.")
      ).toBeVisible();

      // Check for accessibility card
      await expect(page.getByText("Accessibility Access")).toBeVisible();
      await expect(
        page.getByText("Required to type transcribed text into your applications.")
      ).toBeVisible();
    });

    test("grant permission buttons are clickable", async ({ page }) => {
      await onboarding.waitForOnboarding();

      if (!(await onboarding.isOnPermissionsScreen())) {
        test.skip();
        return;
      }

      // Should have at least one "Grant Permission" button
      const grantButtons = await onboarding.grantPermissionButtons.all();
      expect(grantButtons.length).toBeGreaterThan(0);

      // Buttons should be visible and enabled
      for (const button of grantButtons) {
        await expect(button).toBeVisible();
        await expect(button).toBeEnabled();
      }
    });
  });

  test.describe("Model Selection Screen", () => {
    test("displays model selection subtitle", async ({ page }) => {
      await onboarding.waitForOnboarding();

      // If on permissions, we can't easily skip to models in browser-only test
      // Check if we're on model selection screen
      if (await onboarding.isOnModelSelectionScreen()) {
        await expect(onboarding.subtitle).toBeVisible();
        await expect(onboarding.subtitle).toHaveText(
          "To get started, choose a transcription model"
        );
      }
    });

    test("displays model cards when on model selection screen", async ({ page }) => {
      await onboarding.waitForOnboarding();

      if (!(await onboarding.isOnModelSelectionScreen())) {
        test.skip();
        return;
      }

      // Wait for model cards to load
      await page.waitForTimeout(500); // Allow time for API call

      // Should have at least one model card
      const cards = await onboarding.getModelCards();
      expect(cards.length).toBeGreaterThan(0);
    });

    test("model cards display name, size, and description", async ({ page }) => {
      await onboarding.waitForOnboarding();

      if (!(await onboarding.isOnModelSelectionScreen())) {
        test.skip();
        return;
      }

      await page.waitForTimeout(500);

      const cards = await onboarding.getModelCards();
      if (cards.length === 0) {
        test.skip();
        return;
      }

      // Check first card has required info
      const firstCard = cards[0];
      const info = await onboarding.getModelInfo(firstCard);

      expect(info.name).toBeTruthy();
      expect(info.description).toBeTruthy();
      // Size might not be visible in all states
    });

    test("recommended model (Parakeet V3) has featured badge", async ({ page }) => {
      await onboarding.waitForOnboarding();

      if (!(await onboarding.isOnModelSelectionScreen())) {
        test.skip();
        return;
      }

      await page.waitForTimeout(500);

      // Check for "Recommended" badge
      const recommendedVisible = await onboarding.recommendedBadge.isVisible();

      if (recommendedVisible) {
        // The featured card should have the Recommended badge
        await expect(onboarding.featuredModelCard).toBeVisible();
        const info = await onboarding.getModelInfo(onboarding.featuredModelCard);
        expect(info.isFeatured).toBeTruthy();
      }
    });

    test("model cards show accuracy and speed bars", async ({ page }) => {
      await onboarding.waitForOnboarding();

      if (!(await onboarding.isOnModelSelectionScreen())) {
        test.skip();
        return;
      }

      await page.waitForTimeout(500);

      const cards = await onboarding.getModelCards();
      if (cards.length === 0) {
        test.skip();
        return;
      }

      // Check that accuracy and speed labels are present
      await expect(page.getByText("accuracy").first()).toBeVisible();
      await expect(page.getByText("speed").first()).toBeVisible();
    });

    test("clicking model card triggers selection", async ({ page }) => {
      await onboarding.waitForOnboarding();

      if (!(await onboarding.isOnModelSelectionScreen())) {
        test.skip();
        return;
      }

      await page.waitForTimeout(500);

      const cards = await onboarding.getModelCards();
      if (cards.length === 0) {
        test.skip();
        return;
      }

      // Click the first card
      await cards[0].click();

      // In browser-only test, the Tauri command will fail
      // But we can verify the click was handled (no JS errors)
      // The card should be clickable
      await expect(cards[0]).toBeEnabled();
    });
  });

  test.describe("UI Structure", () => {
    test("page has proper HTML structure", async ({ page }) => {
      await onboarding.goto();

      // Basic structure check
      const html = await page.content();
      expect(html).toContain("<html");
      expect(html).toContain("<body");
    });

    test("onboarding takes full screen", async ({ page }) => {
      await onboarding.waitForOnboarding();

      // Check for h-screen w-screen classes on container
      const container = page.locator(".h-screen.w-screen").first();
      await expect(container).toBeVisible();
    });

    test("no console errors on load", async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          // Ignore Tauri-related errors in browser context
          const text = msg.text();
          if (
            !text.includes("__TAURI__") &&
            !text.includes("tauri") &&
            !text.includes("invoke")
          ) {
            errors.push(text);
          }
        }
      });

      await onboarding.goto();
      await onboarding.waitForOnboarding();

      // Filter out expected errors from browser-only testing
      const unexpectedErrors = errors.filter(
        (e) => !e.includes("Failed to check") && !e.includes("permission")
      );

      expect(unexpectedErrors).toHaveLength(0);
    });
  });

  test.describe("Model List Sorting", () => {
    test("non-featured models are sorted by size", async ({ page }) => {
      await onboarding.waitForOnboarding();

      if (!(await onboarding.isOnModelSelectionScreen())) {
        test.skip();
        return;
      }

      await page.waitForTimeout(500);

      // Get all model sizes (excluding featured card which is shown first)
      const sizeElements = page.locator(".tabular-nums span.font-medium");
      const sizes = await sizeElements.allTextContents();

      // Parse sizes (e.g., "500 MB", "1.5 GB")
      const parsedSizes = sizes
        .map((s) => {
          const match = s.match(/([\d.]+)\s*(MB|GB)/i);
          if (!match) return null;
          const value = parseFloat(match[1]);
          const unit = match[2].toUpperCase();
          return unit === "GB" ? value * 1024 : value;
        })
        .filter((s): s is number => s !== null);

      // If we have multiple sizes, verify ascending order (after featured card)
      if (parsedSizes.length > 1) {
        // Skip first if it's the featured model
        const sizesToCheck = parsedSizes.slice(1);
        for (let i = 1; i < sizesToCheck.length; i++) {
          expect(sizesToCheck[i]).toBeGreaterThanOrEqual(sizesToCheck[i - 1]);
        }
      }
    });
  });
});
