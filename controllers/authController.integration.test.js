process.env.JWT_SECRET = "test-secret";

import express from "express";
import supertest from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { ObjectId } from "mongodb";
import JWT from "jsonwebtoken";
import { jest } from "@jest/globals";

import authRoutes from "../routes/authRoutes.js";
import userModel from "../models/userModel.js";

const app = express();
app.use(express.json());
app.use("/api/v1/auth", authRoutes);

const unhashedPassword = "Password123!";
const newPassword = "Password1234!"; // For Password Resets

const testUsers = [
  {
    _id: new ObjectId(),
    name: "Test User 1",
    email: "user1@test.com",
    password: "$2b$10$WXnUxZX2lZs4qtEIEoJEneX.U9JbAECIqpI/5bhdE/MOLptDmitTK", // Password123!
    phone: "91231234",
    address: "Test Address",
    answer: "Football",
    DOB: "2000-01-01",
    role: 0,
  },
  {
    _id: new ObjectId(),
    name: "Test User 2",
    email: "user2@test.com",
    password: "$2b$10$WXnUxZX2lZs4qtEIEoJEneX.U9JbAECIqpI/5bhdE/MOLptDmitTK", // Password123!
    phone: "91231235",
    address: "Test Address 2",
    answer: "Basketball",
    DOB: "2000-02-02",
    role: 0,
  },
];

const mockUser = {
  name: "Test User 3",
  email: "user3@test.com",
  password: "Password123!",
  phone: "91231235",
  address: "Test Address 2",
  answer: "Basketball",
  DOB: "2000-03-03",
};

describe("Auth Controller Integration Tests", () => {
  let mongodb;

  beforeAll(async () => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    mongodb = await MongoMemoryServer.create();
    await mongoose.connect(mongodb.getUri());
    await userModel.insertMany(testUsers);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongodb.stop();
  });

  describe("Registration Controller Integration Tests", () => {
    describe("Success", () => {
      it("should register a new user successfully", async () => {
        const res = await supertest(app).post("/api/v1/auth/register").send({
          name: mockUser.name,
          email: mockUser.email,
          password: mockUser.password,
          phone: mockUser.phone,
          address: mockUser.address,
          DOB: mockUser.DOB,
          answer: mockUser.answer,
        });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("User Registered Successfully");

        const savedUser = await userModel.findById(res.body.user._id);
        expect(savedUser).not.toBeNull();
        expect(savedUser.name).toBe(mockUser.name);
        expect(savedUser.email).toBe(mockUser.email);
        expect(savedUser.phone).toBe(mockUser.phone);
        expect(savedUser.address).toBe(mockUser.address);
        expect(savedUser.answer).toBe(mockUser.answer);
      });
    });

    describe("Field validation", () => {
      it("should return an error when the name field is empty", async () => {
        const res = await supertest(app).post("/api/v1/auth/register").send({
          name: "",
          email: mockUser.email,
          password: mockUser.password,
          phone: mockUser.phone,
          address: mockUser.address,
          DOB: mockUser.DOB,
          answer: mockUser.answer,
        });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Name is required");
      });

      it("should return an error when the email field is empty", async () => {
        const res = await supertest(app).post("/api/v1/auth/register").send({
          name: mockUser.name,
          email: "",
          password: mockUser.password,
          phone: mockUser.phone,
          address: mockUser.address,
          DOB: mockUser.DOB,
          answer: mockUser.answer,
        });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Email is required");
      });
      it("should return an error when the provided email is invalid", async () => {
        const res = await supertest(app).post("/api/v1/auth/register").send({
          name: mockUser.name,
          email: "test",
          password: mockUser.password,
          phone: mockUser.phone,
          address: mockUser.address,
          DOB: mockUser.DOB,
          answer: mockUser.answer,
        });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Email should be a valid email address in the format example@example.com");
      });

      it("should return an error when the password field is empty", async () => {
        const res = await supertest(app).post("/api/v1/auth/register").send({
          name: mockUser.name,
          email: mockUser.email,
          password: "",
          phone: mockUser.phone,
          address: mockUser.address,
          DOB: mockUser.DOB,
          answer: mockUser.answer,
        });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Password is required");
      });

      it("should return an error when the provided password does not meet requirements", async () => {
        const res = await supertest(app).post("/api/v1/auth/register").send({
          name: mockUser.name,
          email: mockUser.email,
          password: "test",
          phone: mockUser.phone,
          address: mockUser.address,
          DOB: mockUser.DOB,
          answer: mockUser.answer,
        });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Passsword should be at least 6 characters long");
      });

      it("should return an error when the phone number field is empty", async () => {
        const res = await supertest(app).post("/api/v1/auth/register").send({
          name: mockUser.name,
          email: mockUser.email,
          password: mockUser.password,
          phone: "",
          address: mockUser.address,
          DOB: mockUser.DOB,
          answer: mockUser.answer,
        });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Phone number is required");
      });

      it("should return an error when the provided phone number is invalid", async () => {
        const res = await supertest(app).post("/api/v1/auth/register").send({
          name: mockUser.name,
          email: mockUser.email,
          password: mockUser.password,
          phone: "123",
          address: mockUser.address,
          DOB: mockUser.DOB,
          answer: mockUser.answer,
        });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Phone should be 8 digits long and begin with 6, 8 or 9");
      });

      it("should return an error when the address field is empty", async () => {
        const res = await supertest(app).post("/api/v1/auth/register").send({
          name: mockUser.name,
          email: mockUser.email,
          password: mockUser.password,
          phone: mockUser.phone,
          address: "",
          DOB: mockUser.DOB,
          answer: mockUser.answer,
        });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Address is required");
      });

      it("should return an error when the DOB field is empty", async () => {
        const res = await supertest(app).post("/api/v1/auth/register").send({
          name: mockUser.name,
          email: mockUser.email,
          password: mockUser.password,
          phone: mockUser.phone,
          address: mockUser.address,
          DOB: "",
          answer: mockUser.answer,
        });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe("DOB is required");
      });

      it("should return an error when the provided DOB is not a valid date", async () => {
        const res = await supertest(app).post("/api/v1/auth/register").send({
          name: mockUser.name,
          email: mockUser.email,
          password: mockUser.password,
          phone: mockUser.phone,
          address: mockUser.address,
          DOB: "test",
          answer: mockUser.answer,
        });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Invalid DOB: Please enter a valid date in the correct format");
      });

      it("should return an error when the provided DOB is not before today's date", async () => {
        const res = await supertest(app).post("/api/v1/auth/register").send({
          name: mockUser.name,
          email: mockUser.email,
          password: mockUser.password,
          phone: mockUser.phone,
          address: mockUser.address,
          DOB: "11/11/2030",
          answer: mockUser.answer,
        });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Invalid DOB: Date must be before today's date");
      });

      it("should return an error when the answer field is empty", async () => {
        const res = await supertest(app).post("/api/v1/auth/register").send({
          name: mockUser.name,
          email: mockUser.email,
          password: mockUser.password,
          phone: mockUser.phone,
          address: mockUser.address,
          DOB: mockUser.DOB,
          answer: "",
        });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Answer is required");
      });
    });

    describe("Error handling", () => {
      it("should return an error when the email is already registered", async () => {
        const res = await supertest(app).post("/api/v1/auth/register").send({
          name: testUsers[0].name,
          email: testUsers[0].email,
          password: testUsers[0].password,
          phone: testUsers[0].phone,
          address: testUsers[0].address,
          DOB: testUsers[0].DOB,
          answer: testUsers[0].answer,
        });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Already registered! Please login.");
      });
    });
  });

  describe("Login Controller Integration Tests", () => {
    describe("Success", () => {
      it("should authenticate a user successfully", async () => {
        const userToken = await JWT.sign({ _id: testUsers[0]._id }, process.env.JWT_SECRET, {
          expiresIn: "7d",
        });

        const res = await supertest(app).post("/api/v1/auth/login").send({
          email: testUsers[0].email,
          password: unhashedPassword,
        });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("Login successfully!");
        expect(res.body.token).toBe(userToken);
      });
    });
    describe("Field validation", () => {
      it("should return an error when the password field is empty", async () => {
        const res = await supertest(app).post("/api/v1/auth/login").send({
          email: testUsers[0].email,
          password: "",
        });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Invalid email or password");
      });

      it("should return an error when the email field is empty", async () => {
        const res = await supertest(app).post("/api/v1/auth/login").send({
          email: "",
          password: unhashedPassword,
        });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Invalid email or password");
      });

      it("should return an error when the email does not exist", async () => {
        const res = await supertest(app).post("/api/v1/auth/login").send({
          email: "nulluser@test.com", // Email does not exist in DB
          password: unhashedPassword,
        });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Invalid email or password");
      });

      it("should return an error when the password is invalid", async () => {
        const res = await supertest(app).post("/api/v1/auth/login").send({
          email: testUsers[0].email,
          password: "incorrectPW", // Valid email but incorrect password
        });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Invalid email or password");
      });
    });
  });
  describe("Forgot Password Controller Integration Tests", () => {
    describe("Success", () => {
      it("should reset password to new password successfully", async () => {
        const res = await supertest(app).post("/api/v1/auth/forgot-password").send({
          email: testUsers[0].email,
          answer: testUsers[0].answer,
          newPassword: newPassword,
        });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("Password Reset Successfully");
      });
    });

    describe("Field validation", () => {
      it("should return an error when the email field is empty", async () => {
        const res = await supertest(app).post("/api/v1/auth/forgot-password").send({
          email: "",
          answer: testUsers[0].answer,
          newPassword: newPassword,
        });
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Email is required");
      });

      it("should return an error when the email field is invalid", async () => {
        const res = await supertest(app).post("/api/v1/auth/forgot-password").send({
          email: "test",
          answer: testUsers[0].answer,
          newPassword: newPassword,
        });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Email should be a valid email address in the format example@example.com");
      });

      it("should return an error when the answer field is empty", async () => {
        const res = await supertest(app).post("/api/v1/auth/forgot-password").send({
          email: testUsers[0].email,
          answer: "",
          newPassword: newPassword,
        });
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Answer is required");
      });

      it("should return an error when the password field is empty", async () => {
        const res = await supertest(app).post("/api/v1/auth/forgot-password").send({
          email: testUsers[0].email,
          answer: testUsers[0].answer,
          newPassword: "",
        });
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("New password is required");
      });

      it("should return an error when the provided password does not meet requirements", async () => {
        const res = await supertest(app).post("/api/v1/auth/forgot-password").send({
          email: testUsers[0].email,
          answer: testUsers[0].answer,
          newPassword: "test",
        });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Passsword should be at least 6 characters long");
      });
    });

    describe("Error handling", () => {
      it("should return an error when the answer is incorrect", async () => {
        const res = await supertest(app).post("/api/v1/auth/forgot-password").send({
          email: testUsers[0].email,
          answer: "Incorrect Answer",
          newPassword: newPassword,
        });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Wrong email or answer");
      });
      it("should return an error when the email is incorrect", async () => {
        const res = await supertest(app).post("/api/v1/auth/forgot-password").send({
          email: "incorrect@email.com",
          answer: testUsers[0].answer,
          newPassword: newPassword,
        });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Wrong email or answer");
      });
    });
  });
});
