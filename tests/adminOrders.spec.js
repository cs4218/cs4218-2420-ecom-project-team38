import { test, expect } from "@playwright/test";
import mongoose from "mongoose";
import userModel from "../models/userModel";
import productModel from "../models/productModel";
import orderModel from "../models/orderModel";
import { hashPassword } from "../helpers/authHelper";
import fs from "fs";

test.describe("Admin orders ui tests", () => {
  let mockAdminUser, mockUser, login;
  let mockProduct, mockOrder;

  test.beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URL);

    const mockPassword = "testpassword123";
    mockAdminUser = {
      name: "Test Admin User",
      email: "testadminuser@gmail.com",
      password: await hashPassword(mockPassword),
      phone: "87654321",
      address: "13 Computing Drive",
      answer: "Software Development",
      DOB: new Date("05/22/2002"),
      role: 1,
    };
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

    login = async (page, isAdmin = true) => {
      await page.getByRole("link", { name: "Login" }).click();
      await page
        .getByRole("textbox", { name: "Enter Your Email" })
        .fill(isAdmin ? mockAdminUser.email : mockUser.email);
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
      photo: {
        data: fs.readFileSync("./tests/images/productPhoto.png"),
        contentType: "image/png",
      },
      shipping: false,
    };

    mockOrder = {
      status: "Not Processed",
      buyer: mockUser._id,
      payment: { success: true },
      products: [mockProduct._id],
    };
  });

  test.beforeEach(async ({ page }) => {
    await mongoose.connection.dropDatabase();
    await userModel.create([mockAdminUser, mockUser]);
    await productModel.create(mockProduct);
    await orderModel.create(mockOrder);

    await page.goto("/");
  });

  test.afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  test("should allow admin user to view users' orders", async ({ page }) => {
    // login
    await login(page);

    // go to orders page
    await page.getByTestId("user-name-dropdown").click();
    await page.getByRole("link", { name: "Dashboard" }).click();
    await page.getByRole("link", { name: "Orders" }).click();

    // view user's order - table headers
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

    // view user's order - order details
    await expect(
      page.getByRole("cell", { name: mockOrder.status })
    ).toBeVisible();
    await expect(page.getByRole("cell", { name: mockUser.name })).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "a few seconds ago" })
    ).toBeVisible();
    await expect(page.getByRole("cell", { name: "Success" })).toBeVisible();
    await expect(
      page.getByRole("cell", { name: mockOrder.products.length }).nth(-1)
    ).toBeVisible();

    // view user's order - product details
    await expect(
      page.getByRole("img", { name: mockProduct.name })
    ).toBeVisible();
    await expect(page.getByText(mockProduct.name)).toBeVisible();
    await expect(page.getByText(mockProduct.description)).toBeVisible();
    await expect(page.getByText(`Price : ${mockProduct.price}`)).toBeVisible();
  });

  test("should allow admin user to update users' order status", async ({
    page,
  }) => {
    const updatedOrderStatus = "Processing";

    // login
    await login(page);

    // go to orders page
    await page.getByTestId("user-name-dropdown").click();
    await page.getByRole("link", { name: "Dashboard" }).click();
    await page.getByRole("link", { name: "Orders" }).click();

    // update order status
    await page.getByText(mockOrder.status).click();
    await page.getByTitle(updatedOrderStatus).locator("div").click();

    // logout
    await page.getByTestId("user-name-dropdown").click();
    await page.getByRole("link", { name: "Logout" }).click();

    // login as non-admin user
    await login(page, false);

    // go to orders page
    await page.getByTestId("user-name-dropdown").click();
    await page.getByRole("link", { name: "Dashboard" }).click();
    await page.getByRole("link", { name: "Orders" }).click();

    await expect(
      page.getByRole("cell", { name: updatedOrderStatus })
    ).toBeVisible();
  });

  test("should redirect unauthorized user from admin orders page to login page", async ({
    page,
  }) => {
    // login as non-admin user
    await login(page, false);

    // go to orders page
    await page.getByTestId("user-name-dropdown").click();
    await page.getByRole("link", { name: "Dashboard" }).click();
    await page.getByRole("link", { name: "Orders" }).click();

    await expect(page).toHaveURL("/dashboard/user/orders");

    // go to admin orders page
    await page.goto("/dashboard/admin/orders");

    await expect(page.getByRole("heading", { name: "All Orders" })).toHaveCount(
      0
    );

    // wait for redirection to login page
    await page.waitForURL("/login");

    await expect(page.getByText("LOGIN FORM")).toBeVisible();
  });
});
