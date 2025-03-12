import Express from "express";
import productRoutes from "./productRoutes";
import request from "supertest";
import productModel from "../models/productModel";
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

    it("Should return no product if slug does not exist", async () => {
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
});
