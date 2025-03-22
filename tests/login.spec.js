import { test, expect } from "@playwright/test";
import { ObjectId } from "mongodb";
import mongoose from "mongoose";

import userModel from "../models/userModel.js";

const existingUserUnhashedPass = "Password123!";
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

const fillAndSubmitLoginForm = async (page, email, password) => {
  await page.getByPlaceholder("Enter Your Email").fill(email);
  await page.getByPlaceholder("Enter Your Password").fill(password);
  await page.getByRole("button", { name: "LOGIN" }).click();
};

test.describe("Login Page UI Test", () => {
  test.beforeAll(async () => {
    const mongoUri = process.env.MONGO_URL;
    await mongoose.connect(mongoUri);
    await userModel.insertOne(existingUser);
  });

  test.afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoose.disconnect();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("Successfully logs in the user with correct credentials", async ({ page }) => {
    await fillAndSubmitLoginForm(page, existingUser.email, existingUserUnhashedPass);
    await expect(page.getByText("Login successfully!")).toBeVisible();
    await page.waitForURL("/");
  });

  test("Prevents login when required fields are empty", async ({ page }) => {
    await fillAndSubmitLoginForm(page, "", existingUserUnhashedPass);
    await expect(page.locator('input[type="email"]:invalid')).toHaveCount(1);
  });

  test("Prevents login with invalid input formats", async ({ page }) => {
    await fillAndSubmitLoginForm(page, existingUser.email, "test");
    await expect(page.getByText("Invalid email or password")).toBeVisible();
  });

  test("Does not authenticate and shows an error for invalid email or password", async ({ page }) => {
    await fillAndSubmitLoginForm(page, existingUser.email, "WrongPassword1!");
    await expect(page.getByText("Invalid email or password")).toBeVisible();
  });

  test("Navigates to the Forgot Password page when the button is clicked", async ({ page }) => {
    await page.getByRole("button", { name: "Forgot Password" }).click();
    await page.waitForURL("/forgot-password");
    await expect(page).toHaveURL("/forgot-password");
  });
});
