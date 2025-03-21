import { test, expect } from "@playwright/test";
import mongoose from "mongoose";

import userModel from "../models/userModel.js";

const newPassword = "Password1234!";
const testUser = {
  name: "Test User 1",
  email: "user1@test.com",
  password: "Password123!",
  phone: "91231234",
  address: "Test Address",
  answer: "Football",
  DOB: "2000-01-01",
};

const fillAndSubmitRegistrationForm = async (page) => {
  await page.getByPlaceholder("Enter Your Name").fill(testUser.name);
  await page.getByPlaceholder("Enter Your Email").fill(testUser.email);
  await page.getByPlaceholder("Enter Your Password").fill(testUser.password);
  await page.getByPlaceholder("Enter Your Phone").fill(testUser.phone);
  await page.getByPlaceholder("Enter Your Address").fill(testUser.address);
  await page.getByPlaceholder("Enter Your DOB").fill(testUser.DOB);
  await page.getByPlaceholder("What is Your Favorite sports").fill(testUser.answer);
  await page.getByRole("button", { name: "REGISTER" }).click();
};

const fillAndSubmitLoginForm = async (page, password) => {
  await page.getByPlaceholder("Enter Your Email").fill(testUser.email);
  await page.getByPlaceholder("Enter Your Password").fill(password);
  await page.getByRole("button", { name: "LOGIN" }).click();
};

const fillAndSubmitForgotPasswordForm = async (page) => {
  await page.getByPlaceholder("Enter Your Email").fill(testUser.email);
  await page.getByPlaceholder("What is Your Favorite sports").fill(testUser.answer);
  await page.getByPlaceholder("Enter Your New Password").fill(newPassword);
  await page.getByRole("button", { name: "RESET PASSWORD" }).click();
};

test.describe("Auth E2E UI Test", () => {
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
    await page.goto("/");
  });

  test("Should authenticate the user after successful registration, allow password reset after logout, and re-authenticate successfully with the new password", async ({ page }) => {
    // Register User
    await page.getByRole("link", { name: "Register" }).click();
    await fillAndSubmitRegistrationForm(page);

    // Ensure User is registered
    await expect(page.getByText("Register Successfully, please login")).toBeVisible();
    const registered_user = await userModel.findOne({ email: testUser.email });
    expect(registered_user.name).toBe(testUser.name);
    await page.waitForURL("/login");
    await expect(page).toHaveURL("/login");

    // Login User
    await fillAndSubmitLoginForm(page, testUser.password);

    // Ensure User is authenticated
    await expect(page.getByText("Login successfully!")).toBeVisible();
    const auth_token = await page.evaluate(() => localStorage.getItem("auth"));
    expect(auth_token).not.toBeNull();
    await page.waitForURL("/");

    // Logout User
    await page.getByTestId("user-name-dropdown").click();
    await page.getByRole("link", { name: "Logout" }).click();
    const removed_token = await page.evaluate(() => localStorage.getItem("auth"));
    expect(removed_token).toBeNull();

    // Ensure User is logged out
    await expect(page.getByText("Logout successfully!")).toBeVisible();
    await page.waitForURL("/login");
    await expect(page).toHaveURL("/login");

    // Reset User's password
    await page.getByRole("button", { name: "Forgot Password" }).click();
    await fillAndSubmitForgotPasswordForm(page);

    // Ensure User's password has been reset
    await expect(page.getByText("Password Reset Successfully, please login")).toBeVisible();
    const reset_user = await userModel.findOne({ email: testUser.email });
    expect(reset_user.password).not.toBe(testUser.password);
    await page.waitForURL("/login");
    await expect(page).toHaveURL("/login");

    // Login with new password
    await fillAndSubmitLoginForm(page, newPassword);

    // Ensure User is authenticated
    await expect(page.getByText("Login successfully!")).toBeVisible();
    await page.waitForURL("/");
    const auth_token_2 = await page.evaluate(() => localStorage.getItem("auth"));
    expect(auth_token_2).not.toBeNull();
  });
});
