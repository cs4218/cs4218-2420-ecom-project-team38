import express from "express";
import authRoutes from "./authRoutes";
import request from "supertest";
import userModel from "../models/userModel";
import productModel from "../models/productModel";
import orderModel from "../models/orderModel";
import mongoose from "mongoose";
import { beforeAll, afterAll, jest } from "@jest/globals";
import { MongoMemoryServer } from "mongodb-memory-server";
import JWT from "jsonwebtoken";
import { comparePassword } from "../helpers/authHelper.js";

const app = express();
app.use(express.json());
app.use("/api/v1/auth", authRoutes);

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

process.env.JWT_SECRET = "test-secret";

jest.spyOn(console, "log").mockImplementation(() => {});

describe("Auth Routes", () => {
  describe("Profile", () => {
    const mockUser = {
      _id: new mongoose.Types.ObjectId("65d21b4667d0d8992e610c85"),
      name: "Test User",
      email: "testuser@gmail.com",
      password: "testpassword123",
      phone: "98765432",
      address: "21 Lower Kent Ridge Rd",
      answer: "Software Testing",
      DOB: new Date("01/23/2004"),
    };

    let mockToken;

    beforeEach(async () => {
      await userModel.deleteMany({});
      await userModel.create(mockUser);
      mockToken = JWT.sign({ _id: mockUser._id }, process.env.JWT_SECRET);
    });

    describe("PUT /api/v1/auth/profile", () => {
      const UPDATE_PROFILE_API = "/api/v1/auth/profile";

      it("should return successful response with updated profile when request is successful", async () => {
        const updatedUser = {
          name: "New User",
          email: "testuser@gmail.com",
          password: "newpassword456",
          phone: "87654321",
          address: "13 Computing Drive",
        };

        const response = await request(app)
          .put(UPDATE_PROFILE_API)
          .set("Authorization", mockToken)
          .send(updatedUser);

        expect(response.status).toBe(200);
        expect(response.body).not.toHaveProperty("error");
        expect(response.body).toHaveProperty("updatedUser");
        expect(response.body.updatedUser.name).toBe(updatedUser.name);
        expect(response.body.updatedUser.email).toBe(mockUser.email);
        expect(
          await comparePassword(
            updatedUser.password,
            response.body.updatedUser.password
          )
        ).toBe(true);
        expect(response.body.updatedUser.phone).toBe(updatedUser.phone);
        expect(response.body.updatedUser.address).toBe(updatedUser.address);
      });

      it("should return response with error message when required values are missing", async () => {
        const updatedUser = {
          name: "  ", // missing
          email: "testuser@gmail.com",
          password: "newpassword456",
          phone: "87654321",
          address: "13 Computing Drive",
        };

        const response = await request(app)
          .put(UPDATE_PROFILE_API)
          .set("Authorization", mockToken)
          .send(updatedUser);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("error");
      });

      it("should return response with error message when values are invalid", async () => {
        const updatedUser = {
          name: "New User",
          email: "testuser@gmail.com",
          password: "newpassword456",
          phone: "NaN", // invalid
          address: "13 Computing Drive",
        };

        const response = await request(app)
          .put(UPDATE_PROFILE_API)
          .set("Authorization", mockToken)
          .send(updatedUser);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("error");
      });

      it("should return error response when request is unauthorized", async () => {
        const updatedUser = {
          name: "New User",
          email: "testuser@gmail.com",
          password: "newpassword456",
          phone: "87654321",
          address: "13 Computing Drive",
        };

        const response = await request(app)
          .put(UPDATE_PROFILE_API)
          .send(updatedUser);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("success", false);
        expect(response.body).toHaveProperty("message", "Unauthorized Access");
      });

      it("should return error response when user is not found", async () => {
        const invalidUserToken = JWT.sign(
          { _id: new mongoose.Types.ObjectId("6714c2a30e8ea8335e4104ff") },
          process.env.JWT_SECRET
        );
        const updatedUser = {
          name: "New User",
          email: "testuser@gmail.com",
          password: "newpassword456",
          phone: "87654321",
          address: "13 Computing Drive",
        };

        const response = await request(app)
          .put(UPDATE_PROFILE_API)
          .set("Authorization", invalidUserToken)
          .send(updatedUser);

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty("success", false);
        expect(response.body).toHaveProperty("message", "User not found");
      });

      it("should return error response when there is a database error", async () => {
        const spy = jest.spyOn(userModel, "findById").mockImplementation(() => {
          throw new Error("Database error");
        });
        const updatedUser = {
          name: "New User",
          email: "testuser@gmail.com",
          password: "newpassword456",
          phone: "87654321",
          address: "13 Computing Drive",
        };

        const response = await request(app)
          .put(UPDATE_PROFILE_API)
          .set("Authorization", mockToken)
          .send(updatedUser);

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty("success", false);
        expect(response.body).toHaveProperty(
          "message",
          "Error while updating profile"
        );
        expect(response.body).toHaveProperty("error");

        spy.mockRestore();
      });
    });
  });

  describe("Order", () => {
    const mockUser = {
      _id: new mongoose.Types.ObjectId("65d21b4667d0d8992e610c85"),
      name: "Test User",
      email: "testuser@gmail.com",
      password: "testpassword123",
      phone: "98765432",
      address: "21 Lower Kent Ridge Rd",
      answer: "Software Testing",
      DOB: new Date("01/23/2004"),
    };
    const mockAdminUser = {
      _id: new mongoose.Types.ObjectId("6714c2a30e8ea8335e4104ff"),
      name: "Other User",
      email: "otheruser@gmail.com",
      password: "otherpassword123",
      phone: "87654321",
      address: "13 Computing Drive",
      answer: "Software Development",
      DOB: new Date("12/09/2002"),
      role: 1,
    };

    const mockProduct = {
      _id: new mongoose.Types.ObjectId("66db427fdb0119d9234b27f3"),
      name: "Test Product Name",
      slug: "Test-Product-Name",
      description: "Test Product Description",
      price: 4.99,
      category: new mongoose.Types.ObjectId("66db427fdb0119d9234b27ef"),
      quantity: 20,
      photo: {},
      shipping: false,
    };

    const mockUserOrder = {
      _id: new mongoose.Types.ObjectId("67a1e2345c9d8f8b9e4b3c1a"),
      status: "Not Processed",
      buyer: mockUser._id,
      payment: { success: true },
      products: [mockProduct._id],
    };
    const mockAdminUserOrder = {
      _id: new mongoose.Types.ObjectId("67b2f5356aeeaf5676d72a44"),
      status: "Shipped",
      buyer: mockAdminUser._id,
      payment: { success: false },
      products: [mockProduct._id],
    };

    let mockToken, mockAdminToken;

    beforeEach(async () => {
      await userModel.deleteMany({});
      await userModel.create([mockUser, mockAdminUser]);
      mockToken = JWT.sign({ _id: mockUser._id }, process.env.JWT_SECRET);
      mockAdminToken = JWT.sign(
        { _id: mockAdminUser._id },
        process.env.JWT_SECRET
      );

      await productModel.deleteMany({});
      await productModel.create(mockProduct);

      await orderModel.deleteMany({});
      await orderModel.create(mockUserOrder);
      await orderModel.create(mockAdminUserOrder);
    });

    describe("GET /api/v1/auth/orders", () => {
      const GET_ORDERS_API = "/api/v1/auth/orders";

      it("should return successful response with order details when request is successful", async () => {
        const response = await request(app)
          .get(GET_ORDERS_API)
          .set("Authorization", mockToken);

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0]).toHaveProperty(
          "_id",
          mockUserOrder._id.toString()
        );
        expect(response.body[0]).toHaveProperty("status", mockUserOrder.status);
        expect(response.body[0].buyer).toHaveProperty("name", mockUser.name);
        expect(response.body[0]).toHaveProperty("createdAt");
        expect(response.body[0].payment).toHaveProperty(
          "success",
          mockUserOrder.payment.success
        );
        expect(response.body[0].products).toHaveLength(1);
      });

      it("should return successful response with product details when request is successful", async () => {
        const response = await request(app)
          .get(GET_ORDERS_API)
          .set("Authorization", mockToken);

        expect(response.status).toBe(200);
        expect(response.body[0].products[0]).toHaveProperty(
          "_id",
          mockProduct._id.toString()
        );
        expect(response.body[0].products[0]).toHaveProperty(
          "name",
          mockProduct.name
        );
        expect(response.body[0].products[0]).toHaveProperty(
          "description",
          mockProduct.description
        );
        expect(response.body[0].products[0]).toHaveProperty(
          "price",
          mockProduct.price
        );
        expect(response.body[0].products[0]).not.toHaveProperty("photo");
      });

      it("should return error response when request is unauthorized", async () => {
        const response = await request(app).get(GET_ORDERS_API);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("success", false);
        expect(response.body).toHaveProperty("message", "Unauthorized Access");
      });

      it("should return error response when there is a database error", async () => {
        const spy = jest.spyOn(orderModel, "find").mockImplementation(() => {
          throw new Error("Database error");
        });

        const response = await request(app)
          .get(GET_ORDERS_API)
          .set("Authorization", mockToken);

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty("success", false);
        expect(response.body).toHaveProperty(
          "message",
          "Error while getting orders"
        );
        expect(response.body).toHaveProperty("error");

        spy.mockRestore();
      });
    });

    describe("GET /api/v1/auth/all-orders", () => {
      const GET_ALL_ORDERS_API = "/api/v1/auth/all-orders";

      it("should return successful response with order details when request is successful", async () => {
        const response = await request(app)
          .get(GET_ALL_ORDERS_API)
          .set("Authorization", mockAdminToken);

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(2);

        // order 1
        expect(response.body[0]).toHaveProperty(
          "_id",
          mockAdminUserOrder._id.toString()
        );
        expect(response.body[0]).toHaveProperty(
          "status",
          mockAdminUserOrder.status
        );
        expect(response.body[0].buyer).toHaveProperty(
          "name",
          mockAdminUser.name
        );
        expect(response.body[0]).toHaveProperty("createdAt");
        expect(response.body[0].payment).toHaveProperty(
          "success",
          mockAdminUserOrder.payment.success
        );
        expect(response.body[0].products).toHaveLength(1);

        // order 2
        expect(response.body[1]).toHaveProperty(
          "_id",
          mockUserOrder._id.toString()
        );
        expect(response.body[1]).toHaveProperty("status", mockUserOrder.status);
        expect(response.body[1].buyer).toHaveProperty("name", mockUser.name);
        expect(response.body[1]).toHaveProperty("createdAt");
        expect(response.body[1].payment).toHaveProperty(
          "success",
          mockUserOrder.payment.success
        );
        expect(response.body[1].products).toHaveLength(1);
      });

      it("should return successful response with product details when request is successful", async () => {
        const response = await request(app)
          .get(GET_ALL_ORDERS_API)
          .set("Authorization", mockAdminToken);

        expect(response.status).toBe(200);
        expect(response.body[0].products[0]).toHaveProperty(
          "_id",
          mockProduct._id.toString()
        );
        expect(response.body[0].products[0]).toHaveProperty(
          "name",
          mockProduct.name
        );
        expect(response.body[0].products[0]).toHaveProperty(
          "description",
          mockProduct.description
        );
        expect(response.body[0].products[0]).toHaveProperty(
          "price",
          mockProduct.price
        );
        expect(response.body[0].products[0]).not.toHaveProperty("photo");
      });

      it("should return error response when request is unauthorized", async () => {
        const response = await request(app)
          .get(GET_ALL_ORDERS_API)
          .set("Authorization", mockToken);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("success", false);
        expect(response.body).toHaveProperty("message", "Unauthorized Access");
      });

      it("should return error response when there is a database error", async () => {
        const spy = jest.spyOn(orderModel, "find").mockImplementation(() => {
          throw new Error("Database error");
        });

        const response = await request(app)
          .get(GET_ALL_ORDERS_API)
          .set("Authorization", mockAdminToken);

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty("success", false);
        expect(response.body).toHaveProperty(
          "message",
          "Error while getting all orders"
        );
        expect(response.body).toHaveProperty("error");

        spy.mockRestore();
      });
    });

    describe("PUT /api/v1/auth/order-status", () => {
      const UPDATE_ORDER_STATUS_API = "/api/v1/auth/order-status";
      const updatedStatus = "Processing";

      it("should return successful response with updated order when request is successful", async () => {
        const response = await request(app)
          .put(`${UPDATE_ORDER_STATUS_API}/${mockUserOrder._id}`)
          .set("Authorization", mockAdminToken)
          .send({ status: updatedStatus });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty(
          "_id",
          mockUserOrder._id.toString()
        );
        expect(response.body).toHaveProperty("status", updatedStatus);
      });

      it("should return error response when order is not found", async () => {
        const invalidOrderId = new mongoose.Types.ObjectId(
          "67c3d42a5b9f8c8c5a7e2f62"
        );

        const response = await request(app)
          .put(`${UPDATE_ORDER_STATUS_API}/${invalidOrderId}`)
          .set("Authorization", mockAdminToken)
          .send({ status: updatedStatus });

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty("success", false);
        expect(response.body).toHaveProperty("message", "Order not found");
      });

      it("should return error response when request is unauthorized", async () => {
        const response = await request(app)
          .put(`${UPDATE_ORDER_STATUS_API}/${mockUserOrder._id}`)
          .set("Authorization", mockToken)
          .send({ status: updatedStatus });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("success", false);
        expect(response.body).toHaveProperty("message", "Unauthorized Access");
      });

      it("should return error response when there is a database error such as invalid status", async () => {
        const invalidStatus = "Invalid Status";

        const response = await request(app)
          .put(`${UPDATE_ORDER_STATUS_API}/${mockUserOrder._id}`)
          .set("Authorization", mockAdminToken)
          .send({ status: invalidStatus });

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty("success", false);
        expect(response.body).toHaveProperty(
          "message",
          "Error while updating order"
        );
      });
    });
  });
});
