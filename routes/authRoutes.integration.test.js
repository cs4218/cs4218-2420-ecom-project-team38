import express from "express";
import authRoutes from "./authRoutes";
import request from "supertest";
import userModel from "../models/userModel";
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

jest.spyOn(console, "log").mockImplementation(() => {});

describe("Auth Routes", () => {
  describe("PUT /api/v1/auth/profile", () => {
    const UPDATE_PROFILE_API = "/api/v1/auth/profile";
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
    process.env.JWT_SECRET = "test-secret";

    let mockToken;

    beforeEach(async () => {
      await userModel.deleteMany({});
      await userModel.create(mockUser);
      mockToken = JWT.sign({ _id: mockUser._id }, process.env.JWT_SECRET);
    });

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
      await mongoose.disconnect();
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

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        "Error while updating profile"
      );
      expect(response.body).toHaveProperty("error");

      const mongoUri = mongo.getUri();
      await mongoose.connect(mongoUri);
    });
  });
});
