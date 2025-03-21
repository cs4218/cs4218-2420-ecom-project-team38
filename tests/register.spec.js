import { test, expect } from "@playwright/test";
import mongoose from "mongoose";
import { ObjectId } from "mongodb";

import userModel from "../models/userModel.js";

const existingUser = {
  _id: new ObjectId(),
  name: "Test User 1",
  email: "user1@test.com",
  password: "$2b$10$WXnUxZX2lZs4qtEIEoJEneX.U9JbAECIqpI/5bhdE/MOLptDmitTK",
  phone: "91231234",
  address: "Test Address",
  answer: "Football",
  DOB: "2000-01-01",
  role: 0,
};

const fillAndSubmitRegistrationForm = async (page, email = "user2@test.com", password = "Password123!") => {
  const name = "Test User 2";
  const phone = "91231235";
  const address = "Test Address 2";
  const answer = "Basketball";
  const DOB = "2000-02-02";

  await page.getByPlaceholder("Enter Your Name").fill(name);
  await page.getByPlaceholder("Enter Your Email").fill(email);
  await page.getByPlaceholder("Enter Your Password").fill(password);
  await page.getByPlaceholder("Enter Your Phone").fill(phone);
  await page.getByPlaceholder("Enter Your Address").fill(address);
  await page.getByPlaceholder("Enter Your DOB").fill(DOB);
  await page.getByPlaceholder("What is Your Favorite sports").fill(answer);
  await page.getByRole("button", { name: "REGISTER" }).click();
};

test.describe("Registration Page UI Test", () => {
  test.beforeAll(async () => {
    const mongoUri = process.env.MONGO_URL;
    await mongoose.connect(mongoUri);
  });

  test.afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoose.disconnect();
  });

  test.beforeEach(async ({ page }) => {
    await userModel.insertOne(existingUser);
    await page.goto("/register");
  });

  test.afterEach(async () => {
    await userModel.deleteMany({});
  });

  test("Registers a new user with valid details successfully", async ({ page }) => {
    await fillAndSubmitRegistrationForm(page);
    await expect(page.getByText("Register Successfully, please login")).toBeVisible();

    const userCountInDB = await userModel.countDocuments();
    expect(userCountInDB).toBe(2);
  });

  test("Display errors when required fields are empty", async ({ page }) => {
    await fillAndSubmitRegistrationForm(page, "");

    const userCountInDB = await userModel.countDocuments();
    expect(userCountInDB).toBe(1);
  });

  test("Display errors for invalid input formats", async ({ page }) => {
    await fillAndSubmitRegistrationForm(page, undefined, "test");
    await expect(page.getByText("Passsword should be at least 6 characters long")).toBeVisible();

    const userCountInDB = await userModel.countDocuments();
    expect(userCountInDB).toBe(1);
  });

  test("Display errors if the email is already registered", async ({ page }) => {
    await fillAndSubmitRegistrationForm(page, existingUser.email, undefined);
    await expect(page.getByText("Already registered! Please login.")).toBeVisible();

    const userCountInDB = await userModel.countDocuments();
    expect(userCountInDB).toBe(1);
  });
});
