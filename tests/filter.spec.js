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
  {
    _id: new mongoose.Types.ObjectId("66db427fdb0119d9234b27f0"),
    name: "Book",
    slug: "book",
    description: "Book description",
    price: 20,
    category: categories[1]._id,
    quantity: 100,
  },
  {
    _id: new mongoose.Types.ObjectId("66db427fdb0119d9234b27f1"),
    name: "Textbook",
    slug: "textbook",
    description: "Textbook description",
    price: 45,
    category: categories[1]._id,
    quantity: 15,
  }
];

test.describe("Filter in home page", () => {
  test.beforeEach(async ({ page }) => {
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

  test("should filter products by category", async ({ page }) => {
    await page.waitForSelector('[data-testid="product-list"]');

    let productCount = await page.locator('[data-testid="product-list"] .card-body').count();
    expect(productCount).toBe(4);

    await page.getByRole("checkbox", { name: "Electronics" }).check();
    await page.waitForSelector('[data-testid="product-list"]');
    productCount = await page.locator('[data-testid="product-list"] .card-body').count();
    expect(productCount).toBe(2);

    await page.getByRole("checkbox", { name: "Electronics" }).uncheck();
    await page.waitForSelector('[data-testid="product-list"]');

    await page.getByRole("checkbox", { name: "Books" }).check();
    await page.waitForSelector('[data-testid="product-list"]');
    productCount = await page.locator('[data-testid="product-list"] .card-body').count();
    expect(productCount).toBe(2);

    await page.getByRole("checkbox", { name: "Books" }).uncheck();
    await page.waitForSelector('[data-testid="product-list"]');
    productCount = await page.locator('[data-testid="product-list"] .card-body').count();
    expect(productCount).toBe(4);
  });

  test("should filter products by price", async ({ page }) => {
    await page.waitForSelector('[data-testid="product-list"]');

    let products = await page.locator('[data-testid="product-list"] .card-body').count();
    expect(products).toBe(4);

    await page.getByRole("radio", { name: "$100 or more" }).check();
    await page.waitForSelector('[data-testid="product-list"]');
    products = await page.locator('[data-testid="product-list"] .card-body').count();
    expect(products).toBe(2);

    await page.getByRole("radio", { name: "$20 to $" }).check();
    await page.waitForSelector('[data-testid="product-list"]');
    products = await page.locator('[data-testid="product-list"] .card-body').count();
    expect(products).toBe(1);
  });

  test("should filter products by both category and price", async ({ page }) => {
    await page.waitForSelector('[data-testid="product-list"]');

    let products = await page.locator('[data-testid="product-list"] .card-body').count();
    expect(products).toBe(4);

    await page.getByRole("checkbox", { name: "Books" }).check();
    await page.getByRole("radio", { name: "$20 to $" }).check();
    await page.waitForSelector('[data-testid="product-list"]');
    products = await page.locator('[data-testid="product-list"] .card-body').count();
    expect(products).toBe(1);
  });

  test("should reset filters", async ({ page }) => {
    await page.waitForSelector('[data-testid="product-list"]');

    let products = await page.locator('[data-testid="product-list"] .card-body').count();
    expect(products).toBe(4);

    await page.getByRole("checkbox", { name: "Electronics" }).check();
    await page.waitForSelector('[data-testid="product-list"]');
    products = await page.locator('[data-testid="product-list"] .card-body').count();
    expect(products).toBe(2);

    await page.getByRole("button", { name: "RESET FILTERS" }).click();
    await page.waitForSelector('[data-testid="product-list"]');
    products = await page.locator('[data-testid="product-list"] .card-body').count();
    expect(products).toBe(4);
  });
});
