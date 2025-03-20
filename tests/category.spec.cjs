import { test, expect } from "@playwright/test";

async function logoutIfLoggedIn(page) {
  const userMenu = page.locator("text=Logout");
  if (await userMenu.isVisible()) {
    await userMenu.click();
    await page.waitForURL("/");
  }
}

test.describe("Category Page", () => {
  test.beforeEach(async ({ page }) => {
    await logoutIfLoggedIn(page);
    await page.goto("/");
  });

  test("should navigate through categories, select a category, add a product in that category to the cart, and prompt login to checkout", async ({
    page,
  }) => {
    await page.click("text=Categories");

    await expect(page.locator(".dropdown-menu")).toBeVisible();
    await expect(page.locator(".dropdown-menu")).toContainText("All Categories");
    await expect(page.locator(".dropdown-menu")).toContainText("Electronics");

    await page.click("text=Electronics");
    await page.waitForURL("/category/electronics");
    await page.getByRole("button", { name: "More Details" }).first().click();

    await expect(page.getByRole("heading", { name: "Name : Laptop" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Description : A powerful laptop" })
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Price :$" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Category : Electronics" })).toBeVisible();

    await page.getByRole("button", { name: "ADD TO CART" }).first().click();

    await page.getByRole("link", { name: "Cart" }).click();
    await page.waitForURL("/cart");

    await expect(page.getByText("You have 1 items in your cart")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Total : $" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Please login to checkout" })).toBeVisible();
  });
});
