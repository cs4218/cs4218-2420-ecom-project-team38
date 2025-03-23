import { test, expect } from "@playwright/test";
import { ObjectId } from "mongodb";
import mongoose from "mongoose";

import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";

// Ayden Test Card
const TEST_VISA_CARD_NUMBER = "4871049999999910";
const last_4_digits = "9910";
const TEST_VISA_EXPIRY_DATE = "03/2030";
const TEST_VISA_CVV = "737";

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

const products = [
  {
    _id: new ObjectId(),
    name: "Laptop",
    slug: "Laptop",
    description: "A powerful laptop",
    price: 11.99,
    quantity: 10,
    category: new ObjectId(),
  },
  {
    _id: new ObjectId(),
    name: "Phone",
    slug: "Phone",
    description: "A powerful phone",
    price: 22.99,
    quantity: 20,
    category: new ObjectId(),
  },
];

const login = async (page) => {
  await page.goto("/login");
  await page.getByPlaceholder("Enter Your Email").fill(user.email);
  await page.getByPlaceholder("Enter Your Password").fill(password);
  await page.getByRole("button", { name: "LOGIN" }).click();
  await expect(page.getByText("Login successfully!")).toBeVisible();
  await page.waitForURL("/");
};

const fillCart = async (page) => {
  for (let product of products) {
    await page.goto("/product/" + product.slug);
    await page.waitForURL("/product/" + product.slug);
    await page.getByRole("button", { name: "ADD TO CART" }).first().click();
  }
  await page.getByRole("link", { name: "Cart" }).click();
  await page.waitForURL("/cart");
};

const enterCreditCardDetails = async (page) => {
  await page.locator('iframe[name="braintree-hosted-field-number"]').contentFrame().getByRole("textbox", { name: "Credit Card Number" }).fill(TEST_VISA_CARD_NUMBER);
  await page.locator('iframe[name="braintree-hosted-field-expirationDate"]').contentFrame().getByRole("textbox", { name: "Expiration Date" }).fill(TEST_VISA_EXPIRY_DATE);
  await page.locator('iframe[name="braintree-hosted-field-cvv"]').contentFrame().getByRole("textbox", { name: "CVV" }).fill(TEST_VISA_CVV);
};

const navigateToCart = async (page) => {
  await page.getByRole("link", { name: "Cart" }).click();
  await page.waitForURL("/cart");
};

test.describe("Cart Page UI Test", () => {
  test.beforeAll(async () => {
    const mongoUri = process.env.MONGO_URL;
    await mongoose.connect(mongoUri);
    await userModel.insertOne(user);
    await productModel.insertMany(products);
  });

  test.afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoose.disconnect();
  });

  test.describe("Cart - Unauthenticated Users", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/cart");
    });
    test("should render empty cart message and login prompt", async ({ page }) => {
      await expect(page.getByText("Hello Guest Your Cart Is Empty")).toBeVisible();
      await expect(page.getByRole("button", { name: "Please login to checkout" })).toBeVisible();
    });
    test("should navigate unauthenticated users to login page when attempting checkout", async ({ page }) => {
      await page.getByRole("button", { name: "Please login to checkout" }).click();
      await page.waitForURL("/login");
      await expect(page).toHaveURL("/login");
    });
  });
  test.describe("Cart - Authenticated Users", () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
      await navigateToCart(page);
    });
    test.describe("Empty Cart", () => {
      test("should render authenticated user info with name, address, and update address button", async ({ page }) => {
        await expect(page.getByText("Hello " + user.name)).toBeVisible();
        await expect(page.getByText(user.address)).toBeVisible();
        await expect(page.getByText("Update Address")).toBeVisible();
      });
      test("should render an empty cart with a message and $0 total", async ({ page }) => {
        await expect(page.getByText("Your Cart Is Empty")).toBeVisible();
        await expect(page.getByText("Total : $0.00")).toBeVisible();
      });
    });
    test.describe("Cart with Items", () => {
      test.beforeEach(async ({ page }) => {
        await fillCart(page);
      });
      test("should render the item added into cart with details, total price, remove button and make payment button", async ({ page }) => {
        for (let product of products) {
          await expect(page.getByTestId("cart-items")).toContainText(product.name);
        }
        await expect(page.getByTestId("cart-items")).toContainText("Remove");
        await expect(page.getByText("Make Payment")).toBeVisible();
        await expect(page.getByText("Choose a way to pay")).toBeVisible();
      });
      test("should remove item from cart when button is clicked", async ({ page }) => {
        const productItem = page.getByTestId("cart-items").locator("div", {
          hasText: products[0].name,
        });
        await productItem.getByRole("button", { name: "Remove" }).click();
        await expect(page.getByTestId("cart-items")).not.toContainText(products[0].name);
        await expect(page.getByTestId("cart-items")).toContainText(products[1].name);
      });
      test("navigates to the update address page when the button is clicked", async ({ page }) => {
        await page.getByRole("button", { name: "Update Address" }).click();
        await page.waitForURL("/dashboard/user/profile");
        await expect(page).toHaveURL("/dashboard/user/profile");
      });
    });
    test.describe("Make Payment", () => {
      test.beforeEach(async ({ page }) => {
        await fillCart(page);
      });
      test("Make payment with valid credit card credentials", async ({ page }) => {
        await expect(page.getByText("Choose a way to pay")).toBeVisible();
        await page.getByRole("button", { name: "Paying with Card" }).click();
        await enterCreditCardDetails(page);

        await page.getByRole("button", { name: "Make Payment" }).click();
        await expect(page.getByText("Paying with Card")).toBeVisible();
        await expect(page.getByRole("button", { name: "Ending in " + last_4_digits + " Visa" })).toBeVisible();
      });
    });
  });
});
