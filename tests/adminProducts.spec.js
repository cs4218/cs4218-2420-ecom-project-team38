import { expect, test } from "@playwright/test";
import mongoose from "mongoose";

import productModel from "../models/productModel";
import userModel from "../models/userModel";
import categoryModel from "../models/categoryModel";
import { hashPassword } from "../helpers/authHelper";
import fs from "fs";
import slugify from "slugify";

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

const categories = [
  {
    _id: new mongoose.Types.ObjectId("66db427fdb0119d9234b27ed"),
    name: "Electronics",
  },
  {
    _id: new mongoose.Types.ObjectId("66db427fdb0119d9234b27ee"),
    name: "Books",
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
    photo: {
      data: fs.readFileSync("./tests/images/phone.jpg"),
      contentType: "image/jpg",
    },
    shipping: true,
  },
  {
    _id: new mongoose.Types.ObjectId("66db427fdb0119d9234b27ef"),
    name: "Laptop",
    slug: "laptop",
    description: "Laptop description",
    price: 2000,
    category: categories[0]._id,
    quantity: 5,
    photo: {
      data: fs.readFileSync("./tests/images/laptop.jpeg"),
      contentType: "image/jpeg",
    },
    shipping: true,
  },
];

test.describe("Admin products UI test", () => {
  test.beforeEach(async ({ page }) => {
    const mongoUri = process.env.MONGO_URL;
    await mongoose.connect(mongoUri);
    await userModel.create({
      ...adminUser,
      password: await hashPassword(adminUser.password),
    });
    await categoryModel.create(categories);
    await productModel.create(products);

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
    await page.getByText("Logout").click();

    await productModel.deleteMany({});
    await categoryModel.deleteMany({});
    await userModel.deleteMany({});
    await mongoose.disconnect();
  });

  test("Should allow admin user to create a product and view it on the Products page", async ({
    page,
  }) => {
    const newProduct = {
      name: "Textbook",
      description: "Textbook description",
      category: categories[1].name,
      image: "./tests/images/textbook.jpg",
      price: 50,
      quantity: 20,
      shipping: "Yes",
    };

    await page.getByRole("link", { name: "Create Product" }).click();
    await page.waitForURL("/dashboard/admin/create-product");

    await page.locator("#rc_select_0").click();
    await page.getByTitle(newProduct.category).click();
    await page.getByText("Upload Photo").click();
    await page.locator("input[name=photo]").setInputFiles(newProduct.image);
    await page.getByPlaceholder("write a name").fill(newProduct.name);
    await page
      .getByPlaceholder("write a description")
      .fill(newProduct.description);
    await page
      .getByPlaceholder("write a Price")
      .fill(newProduct.price.toString());
    await page
      .getByPlaceholder("write a quantity")
      .fill(newProduct.quantity.toString());
    await page.locator("#rc_select_1").click();
    await page.getByTitle(newProduct.shipping).click();
    await page.getByRole("button", { name: "Create Product" }).click();
    await page.waitForURL("/dashboard/admin/products");

    const allProducts = [...products, newProduct];
    const productsList = page.getByTestId("products-list");
    await expect(productsList.getByRole("link")).toHaveCount(
      allProducts.length
    );
    for (let p of allProducts) {
      await expect(
        productsList.getByRole("heading", { name: p.name, level: 5 })
      ).toBeVisible();
      await expect(productsList.getByText(p.description)).toBeVisible();
    }
  });

  test("Should not allow admin user to create duplicate products", async ({
    page,
  }) => {
    const duplicate = {
      ...products[0],
      category: categories[0].name,
      image: "./tests/images/phone.jpg",
      shipping: "No",
    };

    await page.getByRole("link", { name: "Create Product" }).click();
    await page.waitForURL("/dashboard/admin/create-product");

    await page.locator("#rc_select_0").click();
    await page.getByTitle(duplicate.category).click();
    await page.getByText("Upload Photo").click();
    await page.locator("input[name=photo]").setInputFiles(duplicate.image);
    await page.getByPlaceholder("write a name").fill(duplicate.name);
    await page
      .getByPlaceholder("write a description")
      .fill(duplicate.description);
    await page
      .getByPlaceholder("write a Price")
      .fill(duplicate.price.toString());
    await page
      .getByPlaceholder("write a quantity")
      .fill(duplicate.quantity.toString());
    await page.locator("#rc_select_1").click();
    await page.getByTitle(duplicate.shipping).click();
    await page.getByRole("button", { name: "Create Product" }).click();

    await expect(
      page.getByText("Product with same name already exists")
    ).toBeVisible();

    await page.goto("/dashboard/admin/products");
    const productsList = page.getByTestId("products-list");
    await expect(productsList.getByRole("link")).toHaveCount(products.length);
    for (let p of products) {
      await expect(
        productsList.getByRole("heading", { name: p.name, level: 5 })
      ).toBeVisible();
      await expect(productsList.getByText(p.description)).toBeVisible();
    }
  });

  test("Should allow admin user to create a product and view product details", async ({
    page,
  }) => {
    const newProduct = {
      name: "Textbook",
      description: "Textbook description",
      category: categories[1].name,
      image: "./tests/images/textbook.jpg",
      price: 50,
      quantity: 20,
      shipping: "Yes",
    };

    // create product

    await page.getByRole("link", { name: "Create Product" }).click();
    await page.waitForURL("/dashboard/admin/create-product");

    await page.locator("#rc_select_0").click();
    await page.getByTitle(newProduct.category).click();
    await page.getByText("Upload Photo").click();
    await page.locator("input[name=photo]").setInputFiles(newProduct.image);
    await page.getByPlaceholder("write a name").fill(newProduct.name);
    await page
      .getByPlaceholder("write a description")
      .fill(newProduct.description);
    await page
      .getByPlaceholder("write a Price")
      .fill(newProduct.price.toString());
    await page
      .getByPlaceholder("write a quantity")
      .fill(newProduct.quantity.toString());
    await page.locator("#rc_select_1").click();
    await page.getByTitle(newProduct.shipping).click();
    await page.getByRole("button", { name: "Create Product" }).click();
    await page.waitForURL("/dashboard/admin/products");

    // view product details

    const productCreated = page
      .getByTestId("products-list")
      .locator("a")
      .filter({ hasText: newProduct.name });
    await productCreated.click();
    await page.waitForURL(
      `/dashboard/admin/product/${slugify(newProduct.name)}`
    );
    await expect(
      page.locator("div.ant-select").getByTitle(newProduct.category)
    ).toBeVisible();
    await expect(page.getByPlaceholder("write a name")).toHaveValue(
      newProduct.name
    );
    await expect(page.getByPlaceholder("write a description")).toHaveValue(
      newProduct.description
    );
    await expect(page.getByPlaceholder("write a Price")).toHaveValue(
      newProduct.price.toString()
    );
    await expect(page.getByPlaceholder("write a quantity")).toHaveValue(
      newProduct.quantity.toString()
    );
    await expect(
      page.locator("div.ant-select").getByTitle(newProduct.shipping)
    ).toBeVisible();
  });

  test("Should allow admin user to update a product", async ({ page }) => {
    const productToUpdate = {
      ...products[0],
      category: categories[0].name,
      shipping: products[0].shipping ? "Yes" : "No",
    };
    const updateProductDetails = {
      name: "Updated Phone",
      description: "Updated Phone description",
      price: 1500,
      quantity: 15,
      shipping: "No",
      category: categories[1].name,
    };

    // update product

    await page.getByRole("link", { name: "Products" }).click();
    const productToUpdateLink = page
      .getByTestId("products-list")
      .locator("a")
      .filter({ hasText: productToUpdate.name });
    await productToUpdateLink.click();
    await page.waitForURL(`/dashboard/admin/product/${productToUpdate.slug}`);
    await page
      .locator(".ant-select")
      .getByText(productToUpdate.category)
      .click();
    await page.getByTitle(updateProductDetails.category).click();
    await page.getByPlaceholder("write a name").fill(updateProductDetails.name);
    await page
      .getByPlaceholder("write a description")
      .fill(updateProductDetails.description);
    await page
      .getByPlaceholder("write a Price")
      .fill(updateProductDetails.price.toString());
    await page
      .getByPlaceholder("write a quantity")
      .fill(updateProductDetails.quantity.toString());
    await page
      .locator(".ant-select")
      .getByText(productToUpdate.shipping ? "Yes" : "No")
      .click();
    await page.getByTitle(updateProductDetails.shipping).click();
    await page.getByRole("button", { name: "UPDATE PRODUCT" }).click();
    await page.waitForURL("/dashboard/admin/products");

    await expect(page.getByText("Product Updated Successfully")).toBeVisible();
  });

  test("Should allow admin user to delete a product", async ({ page }) => {
    const productToDelete = products[0];
    page.on("dialog", async (dialog) => await dialog.accept());

    await page.getByRole("link", { name: "Products" }).click();
    await page.waitForURL("/dashboard/admin/products");
    const productToDeleteLink = page
      .getByTestId("products-list")
      .locator("a")
      .filter({ hasText: productToDelete.name });
    await productToDeleteLink.click();
    await page.waitForURL(`/dashboard/admin/product/${productToDelete.slug}`);
    await page.getByRole("button", { name: "DELETE PRODUCT" }).click();
    await page.waitForURL("/dashboard/admin/products");

    await expect(page.getByText("Product Deleted Successfully")).toBeVisible();
    await expect(page.getByTestId("products-list")).toHaveCount(
      products.length - 1
    );
    await expect(page.getByTestId("products-list").locator("a")).not.toContain(
      productToDelete.name
    );
  });
});
