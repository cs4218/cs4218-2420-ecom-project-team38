import { test, expect } from "@playwright/test";
import { ObjectId } from "mongodb";
import mongoose from "mongoose";

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

const fillAndSubmitForgotPasswordForm = async (page, email, answer, newPassword) => {
  await page.getByPlaceholder("Enter Your Email").fill(email);
  await page.getByPlaceholder("What is Your Favorite sports").fill(answer);
  await page.getByPlaceholder("Enter Your New Password").fill(newPassword);
  await page.getByRole("button", { name: "RESET PASSWORD" }).click();
};

test.describe("Forgot Password Page UI Test", () => {
  const newPassword = "Password1234!";
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
    await page.goto("/forgot-password");
  });

  test.afterEach(async () => {
    await userModel.deleteMany({});
  });

  test("Resets the password successfully with valid details", async ({ page }) => {
    await fillAndSubmitForgotPasswordForm(page, existingUser.email, existingUser.answer, newPassword);
    await expect(page.getByText("Password Reset Successfully, please login")).toBeVisible();

    const user = await userModel.findOne({ email: existingUser.email });
    expect(user.password).not.toBe(existingUser.password);

    await page.waitForURL("/login");
    await expect(page).toHaveURL("/login");
  });

  test("Does not reset the password when required fields are empty", async ({ page }) => {
    await fillAndSubmitForgotPasswordForm(page, "", existingUser.answer, newPassword);

    const user = await userModel.findOne({ email: existingUser.email });
    expect(user.password).toBe(existingUser.password);
  });

  test("Does not reset the password for invalid input formats", async ({ page }) => {
    await fillAndSubmitForgotPasswordForm(page, existingUser.email, existingUser.answer, "test");
    await expect(page.getByText("Passsword should be at least 6 characters long")).toBeVisible();

    const user = await userModel.findOne({ email: existingUser.email });
    expect(user.password).toBe(existingUser.password);
  });

  test("Does not reset the password if email or security answer is incorrect", async ({ page }) => {
    await fillAndSubmitForgotPasswordForm(page, existingUser.email, "Wrong Answer", newPassword);
    await expect(page.getByText("Wrong email or answer")).toBeVisible();

    const user = await userModel.findOne({ email: existingUser.email });
    expect(user.password).toBe(existingUser.password);
  });
});
