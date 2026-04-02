import { test, expect } from "@playwright/test";

test.describe("Handy App", () => {
  test("dev server responds", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
  });
});
