import { test, expect } from "@playwright/test";

test.describe("Handy App", () => {
  test("dev server responds with success status", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
  });

  test("page renders with document structure", async ({ page }) => {
    await page.goto("/");

    // Verify the document has rendered
    await expect(page.locator("body")).toBeAttached();
  });
});
