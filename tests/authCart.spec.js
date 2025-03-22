import { test, expect } from "@playwright/test";
import { ObjectId } from "mongodb";
import mongoose from "mongoose";

import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";

const user = {
  name: "Test User 1",
  email: "user1@test.com",
  password: "Password123!",
  phone: "91231234",
  address: "Test Address",
  answer: "Football",
  DOB: "2000-01-01",
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

const fillAndSubmitRegistrationForm = async (page) => {
  await page.getByPlaceholder("Enter Your Name").fill(user.name);
  await page.getByPlaceholder("Enter Your Email").fill(user.email);
  await page.getByPlaceholder("Enter Your Password").fill(user.password);
  await page.getByPlaceholder("Enter Your Phone").fill(user.phone);
  await page.getByPlaceholder("Enter Your Address").fill(user.address);
  await page.getByPlaceholder("Enter Your DOB").fill(user.DOB);
  await page.getByPlaceholder("What is Your Favorite sports").fill(user.answer);
  await page.getByRole("button", { name: "REGISTER" }).click();
};

const fillAndSubmitLoginForm = async (page) => {
  await page.getByPlaceholder("Enter Your Email").fill(user.email);
  await page.getByPlaceholder("Enter Your Password").fill(user.password);
  await page.getByRole("button", { name: "LOGIN" }).click();
};

test.describe("Auth, Home, Cart Interactions UI Test", () => {
  test.beforeAll(async () => {
    const mongoUri = process.env.MONGO_URL;
    await mongoose.connect(mongoUri);
    await productModel.insertOne(product);
  });

  test.afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoose.disconnect();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test.afterEach(async ({ page }) => {
    await userModel.deleteMany({});
  });

  test("Cart should persist after logout and re-login", async ({ page }) => {
    // Verify Empty Cart
    await page.getByRole("link", { name: "Cart" }).click();
    await page.waitForURL("/cart");
    await expect(page.getByText("Your Cart Is Empty")).toBeVisible();
    await expect(page.getByText(product.name)).not.toBeVisible();

    // Register User
    await page.getByRole("link", { name: "Register" }).click();
    await fillAndSubmitRegistrationForm(page);

    // Ensure User is registered
    await expect(page.getByText("Register Successfully, please login")).toBeVisible();
    await page.waitForURL("/login");
    await expect(page).toHaveURL("/login");

    // Login User
    await page.getByRole("link", { name: "Login" }).click();
    await page.waitForURL("/login");
    await fillAndSubmitLoginForm(page);

    // Ensure User is authenticated
    await expect(page.getByText("Login successfully!")).toBeVisible();
    await page.waitForURL("/");

    // Add Item into Cart
    await page.getByRole("button", { name: "ADD TO CART" }).nth(0).click();

    // Ensure Item has been added
    await expect(page.getByText("Item added to cart")).toBeVisible();

    // Logout User
    await page.getByTestId("user-name-dropdown").click();
    await page.getByRole("link", { name: "Logout" }).click();

    // Ensure User is logged out
    await expect(page.getByText("Logout successfully!")).toBeVisible();
    await page.waitForURL("/login");
    await expect(page).toHaveURL("/login");

    // Login User
    await fillAndSubmitLoginForm(page);

    // Ensure User is authenticated
    await expect(page.getByText("Login successfully!")).toBeVisible();
    await page.waitForURL("/");

    // Navigate to Cart Page
    await page.getByRole("link", { name: "Cart" }).click();
    await page.waitForURL("/cart");

    // Verify that item has been correctly added and persisted
    await expect(page.getByTestId("cart-items")).toContainText(product.name);
  });

  test("Register, Login, Add Item to Cart, and Verify in Cart Page", async ({ page }) => {
    // Register User
    await page.getByRole("link", { name: "Register" }).click();
    await fillAndSubmitRegistrationForm(page);

    // Ensure User is registered
    await expect(page.getByText("Register Successfully, please login")).toBeVisible();
    await page.waitForURL("/login");
    await expect(page).toHaveURL("/login");

    // Login User
    await fillAndSubmitLoginForm(page);

    // Ensure User is authenticated
    await expect(page.getByText("Login successfully!")).toBeVisible();
    await page.waitForURL("/");

    // Add Item into Cart
    await page.getByRole("button", { name: "ADD TO CART" }).nth(0).click();

    // Ensure Item has been added
    await expect(page.getByText("Item added to cart")).toBeVisible();

    // Navigate to Cart Page
    await page.getByRole("link", { name: "Cart" }).click();
    await page.waitForURL("/cart");

    // Verify that item has been correctly added
    await expect(page.getByTestId("cart-items")).toContainText(product.name);
  });
});
