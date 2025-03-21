import { test, expect } from "@playwright/test";

test.describe("General navigation ui tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should allow user to navigate between about, contact and policy pages", async ({
    page,
  }) => {
    // go to about page
    await page.getByRole("link", { name: "About" }).click();

    await expect(page.getByRole("heading", { name: "ABOUT US" })).toBeVisible();

    // go to contact page
    await page.getByRole("link", { name: "Contact" }).click();
    await expect(
      page.getByRole("heading", { name: "CONTACT US" })
    ).toBeVisible();

    // go to privacy policy page
    await page.getByRole("link", { name: "Privacy Policy" }).click();

    await expect(
      page.getByRole("heading", { name: "PRIVACY POLICY" })
    ).toBeVisible();

    // return to home page
    await page.getByRole("link", { name: "Virtual Vault" }).click();

    await expect(
      page.getByRole("heading", { name: "All Products", exact: true })
    ).toBeVisible();
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
