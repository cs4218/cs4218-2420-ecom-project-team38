import express from "express";
import categoryRoutes from "./categoryRoutes";
import request from "supertest";
import categoryModel from "../models/categoryModel";
import mongoose from "mongoose";
import { beforeAll, afterAll, jest } from "@jest/globals";
import { MongoMemoryServer } from "mongodb-memory-server";

const app = express();
app.use("/api/v1/category", categoryRoutes);

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

jest.spyOn(console, "log").mockImplementation(() => {});

describe("Category Routes", () => {
  const mockCategory1 = { name: "Test Category 1", slug: "test-category-1" };
  const mockCategory2 = { name: "Test Category 2", slug: "test-category-2" };

  describe("GET /api/v1/category/get-category", () => {
    const GET_CATEGORY_API = "/api/v1/category/get-category";

    beforeEach(async () => {
      await categoryModel.deleteMany({});
      await categoryModel.create([mockCategory1, mockCategory2]);
    });

    it("should return successful response with all categories when request is successful", async () => {
      const response = await request(app).get(GET_CATEGORY_API);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("message", "All Categories List");
      expect(response.body.category).toHaveLength(2);
      expect(response.body.category).toEqual(
        expect.arrayContaining([
          expect.objectContaining(mockCategory1),
          expect.objectContaining(mockCategory2),
        ])
      );
    });

    it("should return error response when there is a database error", async () => {
      const spy = jest.spyOn(categoryModel, "find").mockImplementation(() => {
        throw new Error("Database error");
      });

      const response = await request(app).get(GET_CATEGORY_API);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        "Error while getting all categories"
      );
      expect(response.body).toHaveProperty("error");

      spy.mockRestore();
    });
  });

  describe("GET /api/v1/category/single-category", () => {
    const SINGLE_CATEGORY_API = "/api/v1/category/single-category";

    beforeEach(async () => {
      await categoryModel.deleteMany({});
      await categoryModel.create([mockCategory1, mockCategory2]);
    });

    it("should return successful response with the category when request is successful", async () => {
      const response = await request(app).get(
        `${SINGLE_CATEGORY_API}/${mockCategory1.slug}`
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Get Single Category Successfully"
      );
      expect(response.body.category).toHaveProperty("name", mockCategory1.name);
      expect(response.body.category).toHaveProperty("slug", mockCategory1.slug);
    });

    it("should return error response when category not found", async () => {
      const invalidSlug = "invalid-category";

      const response = await request(app).get(
        `${SINGLE_CATEGORY_API}/${invalidSlug}`
      );

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        "Category does not exist"
      );
    });

    it("should return error response when there is a database error", async () => {
      const spy = jest
        .spyOn(categoryModel, "findOne")
        .mockImplementation(() => {
          throw new Error("Database error");
        });

      const response = await request(app).get(
        `${SINGLE_CATEGORY_API}/${mockCategory1.slug}`
      );

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        "Error while getting single category"
      );
      expect(response.body).toHaveProperty("error");

      spy.mockRestore();
    });
  });
});
