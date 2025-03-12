import Express from "express";
import categoryRoutes from "./categoryRoutes";
import request from "supertest";
import categoryModel from "../models/categoryModel";
import userModel from "../models/userModel";
import mongoose from "mongoose";
import { beforeAll, afterAll, jest, expect } from "@jest/globals";
import { MongoMemoryServer } from "mongodb-memory-server";
import jwt from "jsonwebtoken";

const app = Express();
app.use(Express.json());
app.use("/api/v1/category", categoryRoutes);

jest.spyOn(console, "log").mockImplementation(() => {});

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

describe("Category Routes", () => {
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
  const adminUser = {
    _id: new mongoose.Types.ObjectId("66db427fdb0119d9234b27ee"),
    name: "admin",
    email: "admin@example.com",
    DOB: "1990-01-01",
    password: "password",
    address: "address",
    phone: "88888888",
    answer: "answer",
    role: 1,
  };
  const nonAdminUser = {
    _id: new mongoose.Types.ObjectId("66db427fdb0119d9234b27ef"),
    name: "user",
    email: "user@example.com",
    DOB: "1990-01-01",
    password: "password",
    address: "address",
    phone: "99999999",
    answer: "answer",
    role: 0,
  };
  const secret = "secret";

  beforeEach(async () => {
    await categoryModel.deleteMany({});
    await userModel.deleteMany({});
    await categoryModel.create(categories);
    await userModel.create(adminUser);
    process.env.JWT_SECRET = secret;
  });

  describe("POST /api/v1/category/create-category", () => {
    it("Should create a new category", async () => {
      const token = jwt.sign({ _id: adminUser._id }, secret);
      const response = await request(app)
        .post("/api/v1/category/create-category")
        .send({ name: "Food" })
        .set("Authorization", token);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("category");
      expect(response.body.category).toHaveProperty("name", "Food");
    });

    it("Should not create duplicate categories", async () => {
      const token = jwt.sign({ _id: adminUser._id }, secret);
      const response = await request(app)
        .post("/api/v1/category/create-category")
        .send({ name: "Books" })
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        "Category Already Exists"
      );
    });

    it("Non-admin users should not be able to create categories", async () => {
      await userModel.create(nonAdminUser);
      const token = jwt.sign({ _id: nonAdminUser._id }, secret);
      const response = await request(app)
        .post("/api/v1/category/create-category")
        .send({ name: "Food" })
        .set("Authorization", token);
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message", "Unauthorized Access");
      expect(await categoryModel.find({})).toHaveLength(2);
    });

    it("Unauthenticated users should not be able to create categories", async () => {
      const response = await request(app)
        .post("/api/v1/category/create-category")
        .send({ name: "Food" });
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message", "Unauthorized Access");
      expect(await categoryModel.find({})).toHaveLength(2);
    });
  });

  describe("PUT /api/v1/category/update-category/:id", () => {
    it("Should update a category", async () => {
      const token = jwt.sign({ _id: adminUser._id }, secret);
      const response = await request(app)
        .put(`/api/v1/category/update-category/${categories[0]._id}`)
        .send({ name: "Food" })
        .set("Authorization", token);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "messsage",
        "Category Updated Successfully"
      );
      expect(response.body).toHaveProperty("category");
    });

    it("Non-admin users should not be able to update categories", async () => {
      await userModel.create(nonAdminUser);
      const token = jwt.sign({ _id: nonAdminUser._id }, secret);
      const response = await request(app)
        .put(`/api/v1/category/update-category/${categories[0]._id}`)
        .send({ name: "Food" })
        .set("Authorization", token);
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message", "Unauthorized Access");
      expect(await categoryModel.findById(categories[0]._id)).toHaveProperty(
        "name",
        "Electronics"
      );
    });

    it("Unauthenticated users should not be able to update categories", async () => {
      const response = await request(app)
        .put(`/api/v1/category/update-category/${categories[0]._id}`)
        .send({ name: "Food" });
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message", "Unauthorized Access");
      expect(await categoryModel.findById(categories[0]._id)).toHaveProperty(
        "name",
        "Electronics"
      );
    });
  });

  describe("DELETE /api/v1/category/delete-category/:id", () => {
    it("Should delete a category", async () => {
      const token = jwt.sign({ _id: adminUser._id }, secret);
      const response = await request(app)
        .delete(`/api/v1/category/delete-category/${categories[0]._id}`)
        .set("Authorization", token);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Category Deleted Successfully"
      );
      expect(await categoryModel.find({})).toHaveLength(1);
    });

    it("Non-admin users should not be able to delete categories", async () => {
      await userModel.create(nonAdminUser);
      const token = jwt.sign({ _id: nonAdminUser._id }, secret);
      const response = await request(app)
        .delete(`/api/v1/category/delete-category/${categories[0]._id}`)
        .set("Authorization", token);
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message", "Unauthorized Access");
      expect(await categoryModel.find({})).toHaveLength(2);
    });

    it("Unauthenticated users should not be able to delete categories", async () => {
      const response = await request(app).delete(
        `/api/v1/category/delete-category/${categories[0]._id}`
      );
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message", "Unauthorized Access");
      expect(await categoryModel.find({})).toHaveLength(2);
    });
  });
});
