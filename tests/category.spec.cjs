import { test, expect } from "@playwright/test";

test.describe("Category Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should show all the categories in the dropdown", async ({ page }) => {
    await page.click("text=Categories");

    await expect(page.locator(".dropdown-menu")).toBeVisible();
    await expect(page.locator(".dropdown-menu")).toContainText("All Categories");
    await expect(page.locator(".dropdown-menu")).toContainText("Electronics");

    await page.click("text=Electronics");
    await page.waitForURL("/category/electronics");
  });
});
