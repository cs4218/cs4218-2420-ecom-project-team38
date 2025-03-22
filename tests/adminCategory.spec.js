import { test, expect } from "@playwright/test";
import mongoose from "mongoose";
import userModel from "../models/userModel";
import categoryModel from "../models/categoryModel";
import productModel from "../models/productModel";
import { hashPassword } from "../helpers/authHelper";
import fs from "fs";

test.describe("Admin category ui tests", () => {
  let mockAdminUser, mockUser, login;
  let mockCategory, mockProduct;

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

    mockCategory = {
      _id: new mongoose.Types.ObjectId("66db427fdb0119d9234b27ef"),
      name: "Test Category",
      slug: "test-category",
    };

    mockProduct = {
      name: "Test Product Name",
      slug: "Test-Product-Name",
      description: "Test Product Description",
      price: 4.99,
      category: mockCategory._id,
      quantity: 20,
      photo: {
        data: fs.readFileSync("./tests/images/productPhoto.png"),
        contentType: "image/png",
      },
      shipping: false,
    };
  });

  test.beforeEach(async ({ page }) => {
    await userModel.deleteMany({});
    await userModel.create([mockAdminUser, mockUser]);
    await categoryModel.deleteMany({});
    await categoryModel.create(mockCategory);
    await productModel.deleteMany({});
    await productModel.create(mockProduct);

    await page.goto("/");
  });

  test.afterAll(async () => {
    await mongoose.disconnect();
  });

  test("should allow admin user to create new category and filter products", async ({
    page,
  }) => {
    const newCategory = "New Category";

    // login
    await login(page);

    // go to create category page
    await page.getByTestId("user-name-dropdown").click();
    await page.getByRole("link", { name: "Dashboard" }).click();
    await page.getByRole("link", { name: "Create Category" }).click();

    await expect(
      page.getByRole("heading", { name: "Manage Category" })
    ).toBeVisible();

    // create new category
    await page
      .getByRole("textbox", { name: "Enter new category" })
      .fill(newCategory);
    await page.getByRole("button", { name: "Submit" }).click();

    await expect(
      page.getByRole("cell", { name: newCategory, exact: true })
    ).toBeVisible();
    await expect(page.getByText(`${newCategory} is created`)).toBeVisible();

    // go to categories page
    await page.getByRole("link", { name: "Categories" }).click();
    await page.getByRole("link", { name: "All Categories" }).click();

    // go to category product page
    await page.getByRole("link", { name: newCategory, exact: true }).click();

    await expect(
      page.getByRole("heading", {
        name: `Category - ${newCategory}`,
        exact: true,
      })
    ).toBeVisible();
  });

  test("should allow admin user to update category and filter products", async ({
    page,
  }) => {
    const updatedCategory = "Updated Category";

    // login
    await login(page);

    // go to create category page
    await page.getByTestId("user-name-dropdown").click();
    await page.getByRole("link", { name: "Dashboard" }).click();
    await page.getByRole("link", { name: "Create Category" }).click();

    await expect(
      page.getByRole("heading", { name: "Manage Category" })
    ).toBeVisible();

    // update category
    await page.getByRole("button", { name: "Edit" }).click();
    await page
      .getByRole("dialog")
      .getByRole("textbox", { name: "Enter new category" })
      .fill(updatedCategory);
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Submit" })
      .click();

    await expect(
      page.getByRole("cell", { name: updatedCategory, exact: true })
    ).toBeVisible();
    await expect(page.getByText(`${updatedCategory} is updated`)).toBeVisible();

    // go to categories page
    await page.getByRole("link", { name: "Categories" }).click();
    await page.getByRole("link", { name: "All Categories" }).click();

    // go to category product page
    await page
      .getByRole("link", { name: updatedCategory, exact: true })
      .click();

    await expect(
      page.getByRole("heading", {
        name: `Category - ${updatedCategory}`,
        exact: true,
      })
    ).toBeVisible();
    await expect(
      page.getByRole("img", { name: mockProduct.name })
    ).toBeVisible();
    await expect(page.getByText(mockProduct.name)).toBeVisible();
    await expect(page.getByText(mockProduct.description)).toBeVisible();
    await expect(
      page.getByRole("heading", { name: `$${mockProduct.price}` })
    ).toBeVisible();
  });

  test("should allow admin user to delete category only if no products in the category", async ({
    page,
  }) => {
    page.on("dialog", async (dialog) => await dialog.accept());

    // login
    await login(page);

    // go to create category page
    await page.getByTestId("user-name-dropdown").click();
    await page.getByRole("link", { name: "Dashboard" }).click();
    await page.getByRole("link", { name: "Create Category" }).click();

    await expect(
      page.getByRole("heading", { name: "Manage Category" })
    ).toBeVisible();

    // delete category - fails due to existing products
    await page.getByRole("button", { name: "Delete" }).click();

    await expect(
      page.getByText("There are existing products in this category")
    ).toBeVisible();

    // delete product
    await page.getByRole("link", { name: "Products" }).click();
    await page.getByRole("link", { name: mockProduct.name }).click();
    await page.getByRole("button", { name: "DELETE PRODUCT" }).click();

    await expect(page.getByText("Product Deleted Successfully")).toBeVisible();

    // go to create category page
    await page.waitForURL("/dashboard/admin/products");
    await page.getByRole("link", { name: "Create Category" }).click();

    // delete category - succeeds due to no existing products
    await page.getByRole("button", { name: "Delete" }).click();

    await expect(
      page.getByRole("cell", { name: mockCategory.name, exact: true })
    ).toHaveCount(0);
    await expect(page.getByText("category is deleted")).toBeVisible();

    // go to categories page
    await page.getByRole("link", { name: "Categories" }).click();
    await page.getByRole("link", { name: "All Categories" }).click();

    await expect(
      page.getByRole("link", { name: mockCategory.name, exact: true })
    ).toHaveCount(0);
  });

  test("should redirect unauthorized user from create category page to login page", async ({
    page,
  }) => {
    // login as non-admin user
    await login(page, false);

    // go to dashboard page
    await page.getByTestId("user-name-dropdown").click();
    await page.getByRole("link", { name: "Dashboard" }).click();

    await expect(
      page.getByRole("link", { name: "Create Category" })
    ).toHaveCount(0);

    // go to create category page
    await page.goto("/dashboard/admin/create-category");

    await expect(
      page.getByRole("heading", { name: "Manage Category" })
    ).toHaveCount(0);

    // wait for redirection to login page
    await page.waitForURL("/login");

    await expect(page.getByText("LOGIN FORM")).toBeVisible();
  });
});
