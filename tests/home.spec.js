import { test, expect } from "@playwright/test";
import { ObjectId } from "mongodb";
import mongoose from "mongoose";

import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";

const password = "Password123!";
const user = {
  _id: new ObjectId(),
  name: "Test User 1",
  email: "user1@test.com",
  password: "$2b$10$WXnUxZX2lZs4qtEIEoJEneX.U9JbAECIqpI/5bhdE/MOLptDmitTK",
  phone: "91231234",
  address: "Test Address",
  answer: "Football",
  DOB: "2000-01-01",
  role: 0,
};

const product = {
  _id: new ObjectId(),
  name: "Test Product 1",
  slug: "test-product-1",
  description: "Test Description",
  price: 111,
  category: new ObjectId(),
  quantity: 11,
};

const login = async (page) => {
  await page.goto("/login");
  await page.getByPlaceholder("Enter Your Email").fill(user.email);
  await page.getByPlaceholder("Enter Your Password").fill(password);
  await page.getByRole("button", { name: "LOGIN" }).click();
  await expect(page.getByText("Login successfully!")).toBeVisible();
  await page.waitForURL("/");
};

test.describe("Home Page UI Test", () => {
  test.beforeAll(async () => {
    const mongoUri = process.env.MONGO_URL;
    await mongoose.connect(mongoUri);
    await userModel.insertOne(user);
    await productModel.insertMany(product);
  });

  test.afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoose.disconnect();
  });

  test("Adds item to cart and it should be displayed in cart", async ({ page }) => {
    await login(page);

    await page.getByRole("button", { name: "ADD TO CART" }).nth(0).click();
    await expect(page.getByText("Item added to cart")).toBeVisible();

    await page.getByRole("link", { name: "Cart" }).click();
    await page.waitForURL("/cart");

    await expect(page.getByTestId("cart-items")).toContainText(product.name);
  });
  
  test("Clicking on More Details should navigate to product details page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "More Details" }).nth(0).click();
    await page.waitForURL("/product/" + product.slug);

    await expect(page.getByText("Product Details")).toBeVisible();
    await expect(page.getByText(product.name)).toBeVisible();
  });
});
