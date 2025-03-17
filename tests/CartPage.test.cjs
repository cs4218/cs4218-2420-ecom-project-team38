import { test, expect } from "@playwright/test";

const testAccount = {
  email: "DomUITest@gmail.com",
  name: "DomUITest",
  password: "Password123!",
  address: "Test Address",
};

const testProductsName = ["Novel", "Laptop"];

test.describe("Cart - Unauthenticated Users", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/cart");
  });

  test("should render empty cart message and login prompt", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Hello Guest Your Cart Is Empty");
    await expect(page.getByRole("main")).toContainText("Plase login to checkout");
  });

  test("should navigate unauthenticated users to login page when attempting checkout", async ({ page }) => {
    await page.getByRole("button", { name: "Plase login to checkout" }).click();
    await page.waitForURL("/login");
  });
});

test.describe("Cart - Authenticated Users", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("textbox", { name: "Enter Your Email" }).fill(testAccount.email);
    await page.getByRole("textbox", { name: "Enter Your Password" }).fill(testAccount.password);
    await page.getByTestId("login-button").click();
    await page.waitForURL("/");
    await page.getByRole("link", { name: "Cart" }).click();
    await page.waitForURL("/cart");
  });
  test.describe("Empty Cart", () => {
    test("should render authenticated user info with name, address, and update address button", async ({ page }) => {
      await expect(page.locator("h1")).toContainText("Hello " + testAccount.name);
      await expect(page.locator("h5")).toContainText(testAccount.address);
      await expect(page.getByRole("main")).toContainText("Update Address");
    });
    test("should render an empty cart with a message and $0 total", async ({ page }) => {
      await expect(page.locator("h1")).toContainText("Your Cart Is Empty");
      await expect(page.getByRole("main")).toContainText("Total : $0.00");
    });
  });
  test.describe("Cart with Items", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/product/" + testProductsName[0]);
      await page.getByText(testProductsName[0]).first().waitFor();
      await page.getByRole("button", { name: "ADD TO CART" }).first().click();
      await page.getByRole("link", { name: "Cart" }).click();
      await page.waitForURL("/cart");
    });
    test("should render the item added into cart with details, total price, remove button and make payment button", async ({ page }) => {
      await expect(page.getByTestId("cart-items")).toContainText(testProductsName[0]);
      await expect(page.getByTestId("cart-items")).toContainText("Remove");
      await expect(page.getByRole("main")).toContainText("Make Payment");
      await expect(page.getByRole("main")).toContainText("Choose a way to pay");
    });
  });
});
