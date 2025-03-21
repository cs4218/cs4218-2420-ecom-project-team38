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

test.describe("ProductDetails Page", () => {
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

  test("should show no results if product does not exist", async ({ page }) => {
    await page.goto("/product/non-existing-product");
    await page.waitForURL("/404");
    await expect(page.getByRole("heading", { name: "Oops! Page Not Found" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to Home" })).toBeVisible();
  });
});
