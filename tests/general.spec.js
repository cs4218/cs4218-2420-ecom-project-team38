import { test, expect } from "@playwright/test";

test.describe("General ui tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should redirect user to page not found when visited URL is invalid", async ({
    page,
  }) => {
    // visit invalid URL
    await page.goto("/invalid-url");

    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Oops! Page Not Found" })
    ).toBeVisible();

    // return to home page
    await page.getByRole("link", { name: "Back to Home" }).click();

    await expect(
      page.getByRole("heading", { name: "All Products", exact: true })
    ).toBeVisible();
  });
});
