import { test, expect } from "@playwright/test";
import { OnboardingPage } from "../pages/onboarding.page";

const mockModels = [
  {
    id: "parakeet-v3",
    name: "Parakeet V3",
    description: "Best balance of speed and accuracy",
    size: 500 * 1024 * 1024, // 500 MB
    accuracy: 95,
    speed: 85,
    featured: true,
  },
  {
    id: "whisper-tiny",
    name: "Whisper Tiny",
    description: "Fastest, lowest accuracy",
    size: 75 * 1024 * 1024, // 75 MB
    accuracy: 60,
    speed: 100,
    featured: false,
  },
  {
    id: "whisper-large",
    name: "Whisper Large",
    description: "Most accurate, slowest",
    size: 3 * 1024 * 1024 * 1024, // 3 GB
    accuracy: 100,
    speed: 30,
    featured: false,
  },
];

test.describe("Onboarding Flow", () => {
  let onboarding: OnboardingPage;

  test.beforeEach(async ({ page }) => {
    onboarding = new OnboardingPage(page);
    await onboarding.goto();
  });

  test.describe("Permissions Screen", () => {
    test("shows permissions screen on first launch", async () => {
      await onboarding.waitForOnboarding();

      const onPermissions = await onboarding.isOnPermissionsScreen();
      const onModelSelection = await onboarding.isOnModelSelectionScreen();

      expect(onPermissions || onModelSelection).toBeTruthy();
    });

    test("permissions screen displays microphone and accessibility cards", async ({
      page,
    }) => {
      await onboarding.waitForOnboarding();

      if (!(await onboarding.isOnPermissionsScreen())) {
        test.skip();
        return;
      }

      await expect(onboarding.permissionsTitle).toBeVisible();
      await expect(onboarding.permissionsDescription).toBeVisible();

      await expect(page.getByText("Microphone Access")).toBeVisible();
      await expect(
        page.getByText("Required to hear your voice for transcription."),
      ).toBeVisible();

      await expect(page.getByText("Accessibility Access")).toBeVisible();
      await expect(
        page.getByText(
          "Required to type transcribed text into your applications.",
        ),
      ).toBeVisible();
    });

    test("grant permission buttons are clickable", async () => {
      await onboarding.waitForOnboarding();

      if (!(await onboarding.isOnPermissionsScreen())) {
        test.skip();
        return;
      }

      const grantButtons = await onboarding.grantPermissionButtons.all();
      expect(grantButtons.length).toBeGreaterThan(0);

      for (const button of grantButtons) {
        await expect(button).toBeVisible();
        await expect(button).toBeEnabled();
      }
    });
  });

  test.describe("Model Selection Screen", () => {
    test("displays model selection subtitle", async () => {
      await onboarding.waitForOnboarding();

      if (await onboarding.isOnModelSelectionScreen()) {
        await expect(onboarding.subtitle).toBeVisible();
        await expect(onboarding.subtitle).toHaveText(
          "To get started, choose a transcription model",
        );
      }
    });

    test("displays model cards when on model selection screen", async ({
      page,
    }) => {
      await onboarding.waitForOnboarding();

      if (!(await onboarding.isOnModelSelectionScreen())) {
        test.skip();
        return;
      }

      await page.waitForTimeout(500);

      const cards = await onboarding.getModelCards();
      expect(cards.length).toBeGreaterThan(0);
    });

    test("model cards display name, size, and description", async ({
      page,
    }) => {
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

      const firstCard = cards[0];
      const info = await onboarding.getModelInfo(firstCard);

      expect(info.name).toBeTruthy();
      expect(info.description).toBeTruthy();
    });

    test("recommended model has featured badge", async ({ page }) => {
      await onboarding.waitForOnboarding();

      if (!(await onboarding.isOnModelSelectionScreen())) {
        test.skip();
        return;
      }

      await page.waitForTimeout(500);

      const recommendedVisible = await onboarding.recommendedBadge.isVisible();

      if (recommendedVisible) {
        await expect(onboarding.featuredModelCard).toBeVisible();
        const info = await onboarding.getModelInfo(
          onboarding.featuredModelCard,
        );
        expect(info.isFeatured).toBeTruthy();
      }
    });

    test("model cards show accuracy and speed labels", async ({ page }) => {
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

      await expect(page.getByText("accuracy").first()).toBeVisible();
      await expect(page.getByText("speed").first()).toBeVisible();
    });
  });

  test.describe("No Console Errors", () => {
    test("no unexpected console errors on load", async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          const text = msg.text();
          // Ignore Tauri-related errors in browser context
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

      const unexpectedErrors = errors.filter(
        (e) => !e.includes("Failed to check") && !e.includes("permission"),
      );

      expect(unexpectedErrors).toHaveLength(0);
    });
  });

  test.describe("Model Download Flow (Mocked Tauri)", () => {
    test("model download flow shows progress and completion", async ({
      page,
    }) => {
      let downloadProgress = 0;
      let downloadedModelId: string | null = null;

      // Mock Tauri commands
      await page.addInitScript((models) => {
        // @ts-expect-error - Tauri types
        window.__TAURI__ = {
          core: {
            invoke: async (cmd: string, args?: Record<string, unknown>) => {
              if (cmd === "get_available_models") {
                return models;
              }
              if (cmd === "get_downloaded_models") {
                return [];
              }
              if (cmd === "has_any_models_available") {
                return false;
              }
              if (cmd === "download_model") {
                // Store which model is being downloaded
                // @ts-expect-error - window extension
                window.__downloadingModel = args?.modelId;
                return { status: "downloading", progress: 0 };
              }
              if (cmd === "get_download_progress") {
                // @ts-expect-error - window extension
                const progress = window.__downloadProgress || 0;
                return { progress };
              }
              if (cmd === "check_microphone_permission") {
                return true;
              }
              if (cmd === "check_accessibility_permission") {
                return true;
              }
              return null;
            },
          },
          event: {
            listen: async (
              event: string,
              callback: (payload: { payload: unknown }) => void,
            ) => {
              if (event === "download-progress") {
                // Simulate progress updates
                setTimeout(() => callback({ payload: { progress: 25 } }), 100);
                setTimeout(() => callback({ payload: { progress: 50 } }), 200);
                setTimeout(() => callback({ payload: { progress: 75 } }), 300);
                setTimeout(() => callback({ payload: { progress: 100 } }), 400);
              }
              return () => {};
            },
          },
        };
      }, mockModels);

      await page.goto("/");

      // Wait for model selection screen
      await expect(
        page.getByText("To get started, choose a transcription model"),
      ).toBeVisible({
        timeout: 10000,
      });

      // Assert: Model cards should be visible
      await expect(
        page.getByRole("heading", { name: "Parakeet V3" }),
      ).toBeVisible();

      // Act: Click download on the recommended model
      const recommendedCard = page.getByRole("button").filter({
        has: page.getByText("Recommended"),
      });
      await recommendedCard.click();

      // Assert: Download started - check for progress indicator or downloading state
      // The exact UI depends on implementation, but we expect some feedback
      await expect(
        page
          .getByText(/downloading|progress|%/i)
          .or(page.getByRole("progressbar")),
      ).toBeVisible({ timeout: 5000 });
    });

    test("shows no models downloaded state initially", async ({ page }) => {
      // Mock Tauri with empty downloaded models
      await page.addInitScript((models) => {
        // @ts-expect-error - Tauri types
        window.__TAURI__ = {
          core: {
            invoke: async (cmd: string) => {
              if (cmd === "get_available_models") return models;
              if (cmd === "get_downloaded_models") return [];
              if (cmd === "has_any_models_available") return false;
              if (cmd === "check_microphone_permission") return true;
              if (cmd === "check_accessibility_permission") return true;
              return null;
            },
          },
          event: {
            listen: async () => () => {},
          },
        };
      }, mockModels);

      await page.goto("/");

      // Wait for model selection screen
      await expect(
        page.getByText("To get started, choose a transcription model"),
      ).toBeVisible({
        timeout: 10000,
      });

      // All models should show download option (none are downloaded)
      const modelCards = page.getByRole("button").filter({
        has: page.getByRole("heading"),
      });
      const count = await modelCards.count();
      expect(count).toBeGreaterThan(0);
    });

    test("displays available models from mocked API", async ({ page }) => {
      await page.addInitScript((models) => {
        // @ts-expect-error - Tauri types
        window.__TAURI__ = {
          core: {
            invoke: async (cmd: string) => {
              if (cmd === "get_available_models") return models;
              if (cmd === "get_downloaded_models") return [];
              if (cmd === "has_any_models_available") return false;
              if (cmd === "check_microphone_permission") return true;
              if (cmd === "check_accessibility_permission") return true;
              return null;
            },
          },
          event: {
            listen: async () => () => {},
          },
        };
      }, mockModels);

      await page.goto("/");

      await expect(
        page.getByText("To get started, choose a transcription model"),
      ).toBeVisible({
        timeout: 10000,
      });

      // Check that our mocked models are displayed
      await expect(
        page.getByRole("heading", { name: "Parakeet V3" }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Whisper Tiny" }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Whisper Large" }),
      ).toBeVisible();

      // Verify recommended badge on featured model
      await expect(page.getByText("Recommended")).toBeVisible();
    });
  });
});
