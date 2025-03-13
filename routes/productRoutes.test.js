import Express from "express";
import productRoutes from "./productRoutes";
import request from "supertest";
import productModel from "../models/productModel";
import categoryModel from "../models/categoryModel";
import mongoose from "mongoose";
import { beforeAll, afterAll, expect } from "@jest/globals";
import { MongoMemoryServer } from "mongodb-memory-server";

const app = Express();
app.use("/api/v1/product", productRoutes);

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();

  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }

  const mongoUri = mongo.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe("Product Routes", () => {
  describe("GET /api/v1/product/search", () => {
    beforeEach(async () => {
      await productModel.deleteMany({});
      await productModel.create([
        {
          name: "phone",
          slug: "phone",
          description: "phone description",
          price: 1000,
          category: new mongoose.Types.ObjectId("66db427fdb0119d9234b27ee"),
          quantity: 10,
        },
        {
          name: "laptop",
          slug: "laptop",
          description: "laptop description",
          price: 2000,
          category: new mongoose.Types.ObjectId("66db427fdb0119d9234b27ee"),
          quantity: 20,
        },
      ]);
    });

    it("Should return a list of products containing matching keyword", async () => {
      const keyword = "phone";
      const response = await request(app).get(`/api/v1/product/search/${keyword}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty("name", "phone");
      expect(response.body[0]).toHaveProperty("slug", "phone");
      expect(response.body[0]).toHaveProperty("description", "phone description");
      expect(response.body[0]).toHaveProperty("price", 1000);
      expect(response.body[0]).toHaveProperty("category");
      expect(response.body[0]).toHaveProperty("quantity", 10);
    });

    it("Should return an empty list when keyword does not match products", async () => {
      const keyword = "non-existent";
      const response = await request(app).get(`/api/v1/product/search/${keyword}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe("GET /api/v1/product/get-product", () => {
    beforeEach(async () => {
      await productModel.deleteMany({});
      await productModel.create([
        {
          name: "book",
          slug: "book",
          description: "book description",
          price: 10,
          category: new mongoose.Types.ObjectId("67d18a47b92dddc71c78f644"),
          quantity: 20,
        },
        {
          name: "laptop",
          slug: "laptop",
          description: "laptop description",
          price: 2000,
          category: new mongoose.Types.ObjectId("67d18a5fe08b3e56cc31552c"),
          quantity: 25,
        },
      ]);
    });

    it("Should return product with the given slug", async () => {
      const slug = "book";
      const response = await request(app).get(`/api/v1/product/get-product/${slug}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message", "Single Product Fetched");
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("product");

      const { product } = response.body;

      expect(product).toHaveProperty("name", "book");
      expect(product).toHaveProperty("slug", "book");
      expect(product).toHaveProperty("description", "book description");
      expect(product).toHaveProperty("price", 10);
      expect(product).toHaveProperty("category");
      expect(product).toHaveProperty("quantity", 20);
    });

    it("Should return no product when slug does not exist", async () => {
      const slug = "camera";
      const response = await request(app).get(`/api/v1/product/get-product/${slug}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message", "Single Product Fetched");
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("product");

      const { product } = response.body;
      expect(product).toBeNull();
    });
  });

  describe("GET /api/v1/product/related-product", () => {
    let cid;
    let pid;

    beforeEach(async () => {
      await productModel.deleteMany({});
      await categoryModel.deleteMany({});

      const category = await categoryModel.create({
        name: "Electronics",
        slug: "electronics",
      });
      cid = category._id;

      const products = await productModel.create([
        {
          name: "phone",
          slug: "phone",
          description: "phone description",
          price: 1000,
          category: cid,
          quantity: 10,
        },
        {
          name: "laptop",
          slug: "laptop",
          description: "laptop description",
          price: 2000,
          category: cid,
          quantity: 20,
        },
      ]);

      pid = products[0]._id;
    });

    it("Should return related products", async () => {
      const response = await request(app).get(`/api/v1/product/related-product/${pid}/${cid}`);
      expect(response.status).toBe(200);

      const { products } = response.body;
      expect(products).toHaveLength(1);
      expect(products[0]).toHaveProperty("name", "laptop");
      expect(products[0]).toHaveProperty("slug", "laptop");
      expect(products[0]).toHaveProperty("description", "laptop description");
      expect(products[0]).toHaveProperty("price", 2000);
      expect(products[0]).toHaveProperty("category");
      expect(products[0]).toHaveProperty("quantity", 20);
    });

    it("Should return no related products when category does not exist", async () => {
      const fakeCategoryId = new mongoose.Types.ObjectId();

      const response = await request(app).get(
        `/api/v1/product/related-product/${pid}/${fakeCategoryId}`
      );

      expect(response.status).toBe(200);

      const { products } = response.body;
      expect(products).toHaveLength(0);
    });

    it("Should return related products to the category when product ID does not exist", async () => {
      const fakeProductId = new mongoose.Types.ObjectId();

      const response = await request(app).get(
        `/api/v1/product/related-product/${fakeProductId}/${cid}`
      );

      expect(response.status).toBe(200);

      const { products } = response.body;
      expect(products).toHaveLength(2);
      expect(products[0]).toHaveProperty("name", "phone");
      expect(products[1]).toHaveProperty("name", "laptop");
    });

    it("Should return no related products when both product ID and category does not exist", async () => {
      const fakeProductId = new mongoose.Types.ObjectId();
      const fakeCategoryId = new mongoose.Types.ObjectId();

      const response = await request(app).get(
        `/api/v1/product/related-product/${fakeProductId}/${fakeCategoryId}`
      );

      expect(response.status).toBe(200);

      const { products } = response.body;
      expect(products).toHaveLength(0);
    });
  });

  describe("GET /api/v1/product/product-category", () => {
    let cid;

    beforeEach(async () => {
      await productModel.deleteMany({});
      await categoryModel.deleteMany({});

      const categories = await categoryModel.create([
        {
          name: "Electronics",
          slug: "electronics",
        },
        {
          name: "Furniture",
          slug: "furniture",
        },
      ]);
      cid = categories[0]._id;

      await productModel.create([
        {
          name: "book",
          slug: "book",
          description: "book description",
          price: 10,
          category: new mongoose.Types.ObjectId("67d18a47b92dddc71c78f644"),
          quantity: 20,
        },
        {
          name: "laptop",
          slug: "laptop",
          description: "laptop description",
          price: 2000,
          category: cid,
          quantity: 25,
        },
        {
          name: "phone",
          slug: "phone",
          description: "phone description",
          price: 1200,
          category: cid,
          quantity: 10,
        },
      ]);
    });

    it("Should return products of the given category", async () => {
      const slug = "electronics";
      const response = await request(app).get(`/api/v1/product/product-category/${slug}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("products");
      expect(response.body.products).toHaveLength(2);

      const { products } = response.body;
      expect(products[0]).toHaveProperty("name", "laptop");
      expect(products[0]).toHaveProperty("slug", "laptop");

      expect(products[1]).toHaveProperty("name", "phone");
      expect(products[1]).toHaveProperty("slug", "phone");
    });

    it("Should return an empty list when there are no products in the category", async () => {
      const slug = "furniture";
      const response = await request(app).get(`/api/v1/product/product-category/${slug}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("products");
      expect(response.body.products).toHaveLength(0);
    });

    it("Should return an error message if category does not exist", async () => {
      const slug = "does-not-exist";
      const response = await request(app).get(`/api/v1/product/product-category/${slug}`);

      expect(response.status).toBe(404);

      const { success, message } = response.body;
      expect(success).toBe(false);
      expect(message).toBe("Category Not Found");
    });
  });

  describe("GET /api/v1/product/product-count", () => {
    beforeEach(async () => {
      await productModel.deleteMany({});
      await productModel.create([
        {
          name: "watch",
          slug: "watch",
          description: "watch description",
          price: 100,
          category: new mongoose.Types.ObjectId("67d18a47b92dddc71c78f644"),
          quantity: 5,
        },
        {
          name: "sofa",
          slug: "sofa",
          description: "sofa description",
          price: 500,
          category: new mongoose.Types.ObjectId("67d18a5fe08b3e56cc31552c"),
          quantity: 10,
        },
      ]);
    });

    it("Should return the count of all products", async () => {
      const response = await request(app).get("/api/v1/product/product-count");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("total", 2);
    });
  });

  describe("GET /api/v1/product/product-list", () => {
    beforeEach(async () => {
      await productModel.deleteMany({});
      await productModel.create([
        {
          name: "table",
          slug: "table",
          description: "table description",
          price: 100,
          category: new mongoose.Types.ObjectId("67d2e2bbd287b473192ea731"),
          quantity: 20,
        },
        {
          name: "lamp",
          slug: "lamp",
          description: " description",
          price: 50,
          category: new mongoose.Types.ObjectId("67d2e2b0ca8e90f3e42e1c77"),
          quantity: 100,
        },
        {
          name: "chair",
          slug: "chair",
          description: "chair description",
          price: 150,
          category: new mongoose.Types.ObjectId("67d2e29a1213c588a91f0ad4"),
          quantity: 50,
        },
        {
          name: "sofa",
          slug: "sofa",
          description: "sofa description",
          price: 500,
          category: new mongoose.Types.ObjectId("67d18a5fe08b3e56cc31552c"),
          quantity: 10,
        },
        {
          name: "watch",
          slug: "watch",
          description: "watch description",
          price: 100,
          category: new mongoose.Types.ObjectId("67d2e29a1213c588a91f0ad4"),
          quantity: 5,
        },
        {
          name: "phone",
          slug: "phone",
          description: "phone description",
          price: 1200,
          category: new mongoose.Types.ObjectId("67d2e29156a5fa0c85fa5796"),
          quantity: 24,
        },
      ]);
    });

    it("Should return the list of products on the current page", async () => {
      const page = 1;
      const response = await request(app).get(`/api/v1/product/product-list/${page}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("products");

      const { products } = response.body;
      expect(products).toHaveLength(6);
    });
  });
});
