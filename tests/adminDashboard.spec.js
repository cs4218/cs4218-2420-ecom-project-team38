import { expect, test } from "@playwright/test";
import userModel from "../models/userModel";
import { hashPassword } from "../helpers/authHelper";
import mongoose from "mongoose";

const adminUser = {
  name: "Admin user",
  email: "adminuser@example.com",
  password: "adminUser123!",
  phone: "87654321",
  address: "123 Computing Drive",
  answer: "Volleyball",
  DOB: new Date(2000, 1, 1),
  role: 1,
};

const nonAdminUser = {
  name: "Non amdin user",
  email: "user@example.com",
  password: "User123!",
  phone: "87654321",
  address: "123 Computing Drive",
  answer: "Volleyball",
  DOB: new Date(2000, 1, 1),
  role: 0,
};

test.describe("Admin dashboard ui test", () => {
  test.beforeEach(async ({ page }) => {
    const mongoUri = process.env.MONGO_URL;
    await mongoose.connect(mongoUri);
    await userModel.create([
      { ...adminUser, password: await hashPassword(adminUser.password) },
      { ...nonAdminUser, password: await hashPassword(nonAdminUser.password) },
    ]);

    await page.goto("/login");
    await page.getByPlaceholder("Enter Your Email").fill(adminUser.email);
    await page.getByPlaceholder("Enter Your Password").fill(adminUser.password);
    await page.getByRole("button", { name: "Login" }).click();
    await page.waitForURL("/");

    await page.getByTestId("user-name-dropdown").click();
    await page.getByRole("link", { name: "Dashboard" }).click();
    await page.waitForURL("/dashboard/admin");
  });

  test.afterEach(async ({ page }) => {
    await page.getByTestId("user-name-dropdown").click();
    await page.getByRole("link", { name: "Logout" }).click();
    await userModel.deleteMany({});
    await mongoose.disconnect();
  });

  test("Should display admin user details", async ({ page }) => {
    expect(
      page.getByRole("heading", {
        name: `Admin Name : ${adminUser.name}`,
        level: 3,
      })
    ).toBeVisible();
    expect(
      page.getByRole("heading", {
        name: `Admin Email : ${adminUser.email}`,
        level: 3,
      })
    ).toBeVisible();
    expect(
      page.getByRole("heading", {
        name: `Admin Contact : ${adminUser.phone}`,
        level: 3,
      })
    ).toBeVisible();
  });

  test("Admin user should be able to navigate to create category page", async ({
    page,
  }) => {
    await page.getByRole("link", { name: "Create Category" }).click();

    expect(page.url()).toBe(
      "http://127.0.0.1:3000/dashboard/admin/create-category"
    );
  });

  test("Admin user should be able to navigate to create product page", async ({
    page,
  }) => {
    await page.getByRole("link", { name: "Create Product" }).click();
    await page.waitForURL("/dashboard/admin/create-product");

    expect(page.url()).toBe(
      "http://127.0.0.1:3000/dashboard/admin/create-product"
    );
  });

  test("Admin user should be able to navigate to view products page", async ({
    page,
  }) => {
    await page.getByRole("link", { name: "Products" }).click();
    await page.waitForURL("/dashboard/admin/products");

    expect(page.url()).toBe("http://127.0.0.1:3000/dashboard/admin/products");
  });

  test("Admin user should be able to orders page", async ({ page }) => {
    await page.getByRole("link", { name: "Orders" }).click();
    await page.waitForURL("/dashboard/admin/orders");

    expect(page.url()).toBe("http://127.0.0.1:3000/dashboard/admin/orders");
  });

  test("Non admin user should not be able to access admin dashboard", async ({
    page,
  }) => {
    await page.getByTestId("user-name-dropdown").click();
    await page.getByRole("link", { name: "Logout" }).click();

    await page.getByPlaceholder("Enter Your Email").fill(nonAdminUser.email);
    await page
      .getByPlaceholder("Enter Your Password")
      .fill(nonAdminUser.password);
    await page.getByRole("button", { name: "Login" }).click();
    await page.waitForURL("/");

    await page.goto("/dashboard/admin");
    await page.waitForURL("/login");
    expect(
      page.getByRole("heading", { name: "LOGIN FORM", level: 4 })
    ).toBeVisible();
  });
});
