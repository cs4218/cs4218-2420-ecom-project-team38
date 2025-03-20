import { test, expect } from "@playwright/test";
import mongoose from "mongoose";
import userModel from "../models/userModel";
import productModel from "../models/productModel";
import { hashPassword } from "../helpers/authHelper";

test.describe("Orders page ui tests", () => {
  let mockUser, login, mockProduct;

  test.beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URL);

    const mockPassword = "testpassword123";
    mockUser = {
      _id: new mongoose.Types.ObjectId("65d21b4667d0d8992e610c85"),
      name: "Test User",
      email: "testuser@gmail.com",
      password: await hashPassword(mockPassword),
      phone: "98765432",
      address: "21 Lower Kent Ridge Rd",
      answer: "Software Testing",
      DOB: new Date("01/23/2004"),
    };

    login = async (page) => {
      await page.getByRole("link", { name: "Login" }).click();
      await page
        .getByRole("textbox", { name: "Enter Your Email" })
        .fill(mockUser.email);
      await page
        .getByRole("textbox", { name: "Enter Your Password" })
        .fill(mockPassword);
      await page.getByRole("button", { name: "LOGIN" }).click();

      await expect(page.getByText("Login successfully!")).toBeVisible();
    };

    mockProduct = {
      _id: new mongoose.Types.ObjectId("66db427fdb0119d9234b27f3"),
      name: "Test Product Name",
      slug: "Test-Product-Name",
      description: "Test Product Description",
      price: 4.99,
      category: new mongoose.Types.ObjectId("66db427fdb0119d9234b27ef"),
      quantity: 20,
      photo: {},
      shipping: false,
    };
  });

  test.beforeEach(async ({ page }) => {
    await userModel.deleteMany({});
    await userModel.create(mockUser);
    await productModel.deleteMany({});
    await productModel.create(mockProduct);

    await page.goto("/");
  });

  test.afterAll(async () => {
    await mongoose.disconnect();
  });

  test("should allow user to place and view new order", async ({ page }) => {
    // login
    await login(page);

    // add product to cart
    await page.getByRole("button", { name: "ADD TO CART" }).click();

    await expect(page.getByText("Item added to cart")).toBeVisible();

    // go to cart page
    await page.getByRole("link", { name: "Cart" }).click();

    // make payment
    await page.getByRole("button", { name: "Paying with Card" }).click();
    await page
      .locator('iframe[name="braintree-hosted-field-number"]')
      .contentFrame()
      .getByRole("textbox", { name: "Credit Card Number" })
      .fill("3714 496353 98431");
    await page
      .locator('iframe[name="braintree-hosted-field-expirationDate"]')
      .contentFrame()
      .getByRole("textbox", { name: "Expiration Date" })
      .fill("1027");
    await page
      .locator('iframe[name="braintree-hosted-field-cvv"]')
      .contentFrame()
      .getByRole("textbox", { name: "CVV" })
      .fill("1234");
    await page.getByRole("button", { name: "Make Payment" }).click();

    await expect(
      page.getByText("Payment Completed Successfully")
    ).toBeVisible();

    // wait for redirection to orders page
    await page.waitForURL("/dashboard/user/orders");

    // view new order - table headers
    await expect(page.getByRole("columnheader", { name: "#" })).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Status" })
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Buyer" })
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Date" })
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Payment" })
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Quantity" })
    ).toBeVisible();

    // view new order - order details
    await expect(
      page.getByRole("cell", { name: "Not Processed" })
    ).toBeVisible();
    await expect(page.getByRole("cell", { name: mockUser.name })).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "a few seconds ago" })
    ).toBeVisible();
    await expect(page.getByRole("cell", { name: "Success" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "1" }).nth(-1)).toBeVisible();

    // view new order - product details
    await expect(
      page.getByRole("img", { name: mockProduct.name })
    ).toBeVisible();
    await expect(page.getByText(mockProduct.name)).toBeVisible();
    await expect(page.getByText(mockProduct.description)).toBeVisible();
    await expect(page.getByText(`Price : ${mockProduct.price}`)).toBeVisible();
  });
});
