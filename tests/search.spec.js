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

test.describe("Product search page", () => {
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

  test("Should display search results", async ({ page }) => {
    const expectedResult = products[0];
    await page.getByPlaceholder("Search").fill(products[0].name);
    await page.getByRole("button", { name: "Search" }).click();
    await page.waitForURL("/search");

    expect(
      page.getByRole("heading", { name: "Found 1", level: 6 })
    ).toBeVisible();
    expect(page.getByTestId("product-card")).toHaveCount(1);
    expect(
      page.getByRole("heading", { name: expectedResult.name, level: 5 })
    ).toBeVisible();
    expect(page.getByText(expectedResult.description)).toBeVisible();
    expect(page.getByText(`$ ${expectedResult.price}`)).toBeVisible();
    expect(page.getByRole("button", { name: "More Details" })).toBeVisible();
    expect(page.getByRole("button", { name: "ADD TO CART" })).toBeVisible();
  });

  test("Can view product details and related products", async ({ page }) => {
    const productToView = products[0];
    const relatedProduct = products[1];
    await page.getByPlaceholder("Search").fill(productToView.name);
    await page.getByRole("button", { name: "Search" }).click();
    await page.waitForURL("/search");

    await page.getByRole("button", { name: "More Details" }).click();
    await page.waitForURL(`/product/${productToView.slug}`);

    expect(
      page.getByRole("heading", {
        name: `Name : ${productToView.name}`,
        level: 6,
      })
    ).toBeVisible();
    expect(
      page.getByRole("heading", {
        name: `Description : ${productToView.description}`,
        level: 6,
      })
    ).toBeVisible();
    expect(
      page.getByRole("heading", {
        name: `Price :${productToView.price.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        })}`,
        level: 6,
      })
    ).toBeVisible();
    expect(
      page.getByRole("heading", {
        name: `Category : ${categories[0].name}`,
        level: 6,
      })
    ).toBeVisible();

    const relatedProducts = page.getByTestId("related-products");
    expect(
      relatedProducts.getByRole("heading", {
        name: relatedProduct.name,
        level: 5,
      })
    ).toBeVisible();
    expect(
      relatedProducts.getByRole("heading", {
        name: relatedProduct.price.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        }),
        level: 5,
      })
    ).toBeVisible();
    expect(
      relatedProducts.getByRole("heading", {
        name: relatedProduct.price.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        }),
      })
    ).toBeVisible();
    expect(
      relatedProducts.getByText(
        `${relatedProduct.description.substring(0, 60)}...`
      )
    ).toBeVisible();
  });

  test("Can add product to cart", async ({ page }) => {
    const productToAdd = products[0];
    await page.getByPlaceholder("Search").fill(productToAdd.name);
    await page.getByRole("button", { name: "Search" }).click();

    await page.waitForURL("/search");
    await page.getByRole("button", { name: "ADD TO CART" }).click();
    await page.getByRole("link", { name: "Cart" }).click();
    await page.waitForURL("/cart");

    expect(page.getByRole("heading", { name: "Hello Guest" }));
    expect(
      page.getByText("You have 1 item in your cart please login to checkout !")
    ).toBeVisible();
    expect(page.getByTestId("cart-items")).toHaveCount(1);
    expect(
      page.getByRole("heading", {
        name: `Total : ${productToAdd.price.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        })}`,
      })
    ).toBeVisible();
  });
});
