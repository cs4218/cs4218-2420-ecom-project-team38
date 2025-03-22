import { test, expect } from "@playwright/test";
import mongoose from "mongoose";
import productModel from "../models/productModel";
import categoryModel from "../models/categoryModel";

const categories = [
  {
    _id: new mongoose.Types.ObjectId("66db427fdb0119d9234b27ee"),
    name: "Electronics",
    slug: "electronics",
  },
  {
    _id: new mongoose.Types.ObjectId("66db427fdb0119d9234b27ef"),
    name: "Books",
    slug: "books",
  },
];

const products = [
  {
    _id: new mongoose.Types.ObjectId("66db427fdb0119d9234b27ee"),
    name: "Phone",
    slug: "phone",
    description: "Phone description",
    price: 1000,
    category: categories[0]._id,
    quantity: 10,
  },
  {
    _id: new mongoose.Types.ObjectId("66db427fdb0119d9234b27ef"),
    name: "Laptop",
    slug: "laptop",
    description: "Laptop description",
    price: 2000,
    category: categories[0]._id,
    quantity: 5,
  },
];

async function logoutIfLoggedIn(page) {
  const userMenu = page.locator("text=Logout");
  if (await userMenu.isVisible()) {
    await userMenu.click();
    await page.waitForURL("/");
  }
}

test.describe("User experience: CategoryPage to Checkout", () => {
  test.beforeEach(async ({ page }) => {
    await logoutIfLoggedIn(page);

    const mongoUri = process.env.MONGO_URL;
    await mongoose.connect(mongoUri);
    await categoryModel.create(categories);
    await productModel.create(products);
    await page.goto("/");
  });

  test.afterEach(async () => {
    await productModel.deleteMany({});
    await categoryModel.deleteMany({});
    await mongoose.disconnect();
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

    await expect(page.getByRole("heading", { name: `Name : ${products[0].name}` })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: `Description : ${products[0].description}` })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: `Category : ${categories[0].name}` })
    ).toBeVisible();

    await page.getByRole("button", { name: "ADD TO CART" }).first().click();

    await page.getByRole("link", { name: "Cart" }).click();
    await page.waitForURL("/cart");

    await expect(page.getByText("You have 1 item in your cart")).toBeVisible();
    expect(
      page.getByRole("heading", {
        name: `Total : ${products[0].price.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        })}`,
      })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Please login to checkout" })).toBeVisible();
  });

  test("should show no results if category does not exist", async ({ page }) => {
    await page.goto("/category/non-existent-category");
    await expect(page.getByRole("heading", { name: "Category -" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "0 result found" })).toBeVisible();
  });
});
