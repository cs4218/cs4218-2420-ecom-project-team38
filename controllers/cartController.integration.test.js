import express from "express";
import supertest from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { ObjectId } from "mongodb";
import { jest } from "@jest/globals";

import cartRoutes from "../routes/cartRoutes.js";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";

const app = express();
app.use(express.json());
app.use("/api/v1/cart", cartRoutes);

const product = {
  _id: new ObjectId("abcdefabcdefabcdefabcdef"),
  name: "Test Product 1",
  slug: "test-product-1",
  description: "Test Description",
  price: 111,
  category: new ObjectId(),
  quantity: 11,
};

const user_empty_cart = {
  _id: new ObjectId("abcdefabcdefabcdefabcdef"),
  name: "Test User 1",
  email: "user1@test.com",
  password: "$2b$10$WXnUxZX2lZs4qtEIEoJEneX.U9JbAECIqpI/5bhdE/MOLptDmitTK", // Password123!
  phone: "91231234",
  address: "Test Address",
  answer: "Football",
  DOB: "2000-01-01",
  role: 0,
  cart: [],
};

const user_non_empty_cart = {
  _id: new ObjectId("abcdefabcdefabcdefabcdef"),
  name: "Test User 1",
  email: "user1@test.com",
  password: "$2b$10$WXnUxZX2lZs4qtEIEoJEneX.U9JbAECIqpI/5bhdE/MOLptDmitTK", // Password123!
  phone: "91231234",
  address: "Test Address",
  answer: "Football",
  DOB: "2000-01-01",
  role: 0,
  cart: ["abcdefabcdefabcdefabcdef"],
};

describe("Cart Controller Integration Tests", () => {
  let mongodb;

  beforeAll(async () => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    mongodb = await MongoMemoryServer.create();
    await mongoose.connect(mongodb.getUri());
    await productModel.insertOne(product);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongodb.stop();
  });

  afterEach(async () => {
    await userModel.deleteMany({});
  });

  describe("Add Item To Cart Controller Integration Tests", () => {
    beforeEach(async () => {
      await userModel.insertOne(user_empty_cart);
    });

    describe("Success", () => {
      it("should add item into cart successfully", async () => {
        const res = await supertest(app).post("/api/v1/cart/add-item").send({
          userId: user_empty_cart._id,
          productId: product._id,
        });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("Item added into cart Successfully");

        const db_user = await userModel.findById(user_empty_cart._id);
        expect(db_user.cart).toEqual([product._id]);
      });
    });
    describe("Field validation", () => {
      it("should return an error when the fields are empty", async () => {
        const res = await supertest(app).post("/api/v1/cart/add-item").send({
          productId: product._id,
        });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("User ID and Product ID are required");

        const db_user = await userModel.findById(user_empty_cart._id);
        expect(db_user.cart).toEqual([]);
      });
      it("should return an error when the user does not exist", async () => {
        const res = await supertest(app).post("/api/v1/cart/add-item").send({
          userId: "invalidID",
          productId: product._id,
        });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Error adding item into cart");

        const db_user = await userModel.findById(user_empty_cart._id);
        expect(db_user.cart).toEqual([]);
      });
    });
  });
  describe("Remove Item From Cart Controller Integration Tests", () => {
    beforeEach(async () => {
      await userModel.insertOne(user_non_empty_cart);
    });

    describe("Success", () => {
      it("should remove item from cart successfully", async () => {
        const res = await supertest(app).post("/api/v1/cart/remove-item").send({
          userId: user_non_empty_cart._id,
          productId: product._id,
        });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("Item removed from cart successfully");

        const db_user = await userModel.findById(user_non_empty_cart._id);
        expect(db_user.cart).toEqual([]);
      });
    });
    describe("Field validation", () => {
      it("should return an error when the fields are empty", async () => {
        const res = await supertest(app).post("/api/v1/cart/remove-item").send({
          productId: product._id,
        });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("User ID and Product ID are required");

        const db_user = await userModel.findById(user_non_empty_cart._id);
        expect(db_user.cart).toEqual([product._id]);
      });

      it("should return an error when the user does not exist", async () => {
        const res = await supertest(app).post("/api/v1/cart/remove-item").send({
          userId: "invalidID",
          productId: product._id,
        });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Error removing item from cart");

        const db_user = await userModel.findById(user_non_empty_cart._id);
        expect(db_user.cart).toEqual([product._id]);
      });
    });
  });
  describe("Clear Cart Controller Integration Tests", () => {
    beforeEach(async () => {
      await userModel.insertOne(user_non_empty_cart);
    });

    describe("Success", () => {
      it("should clear cart successfully", async () => {
        const res = await supertest(app).post("/api/v1/cart/clear-cart").send({
          userId: user_non_empty_cart._id,
        });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("Cart cleared successfully");

        const db_user = await userModel.findById(user_non_empty_cart._id);
        expect(db_user.cart).toEqual([]);
      });
    });
    describe("Field validation", () => {
      it("should return an error when the fields are empty", async () => {
        const res = await supertest(app).post("/api/v1/cart/clear-cart").send({});
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("User ID is required");

        const db_user = await userModel.findById(user_non_empty_cart._id);
        expect(db_user.cart).toEqual([product._id]);
      });

      it("should return an error when the user does not exist", async () => {
        const res = await supertest(app).post("/api/v1/cart/clear-cart").send({
          userId: "invalidID",
        });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Error clearing cart");

        const db_user = await userModel.findById(user_non_empty_cart._id);
        expect(db_user.cart).toEqual([product._id]);
      });
    });
  });
});
