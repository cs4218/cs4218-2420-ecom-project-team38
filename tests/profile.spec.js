import { test, expect } from "@playwright/test";
import mongoose from "mongoose";
import userModel from "../models/userModel";
import { hashPassword } from "../helpers/authHelper";

test.describe("Profile ui tests", () => {
  let mockUser, login;

  test.beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URL);

    const mockPassword = "testpassword123";
    mockUser = {
      name: "Test User",
      email: "testuser@gmail.com",
      password: await hashPassword(mockPassword),
      phone: "98765432",
      address: "21 Lower Kent Ridge Rd",
      answer: "Software Testing",
      DOB: new Date("01/23/2004"),
    };

    login = async (page) => {
      await page.getByRole("link", { name: "Login" }).click();
      await page
        .getByRole("textbox", { name: "Enter Your Email" })
        .fill(mockUser.email);
      await page
        .getByRole("textbox", { name: "Enter Your Password" })
        .fill(mockPassword);
      await page.getByRole("button", { name: "LOGIN" }).click();

      await expect(page.getByText("Login successfully!")).toBeVisible();
    };
  });

  test.beforeEach(async ({ page }) => {
    await userModel.deleteMany({});
    await userModel.create(mockUser);

    await page.goto("/");
  });

  test.afterAll(async () => {
    await mongoose.disconnect();
  });

  test("should allow user to view and update profile", async ({ page }) => {
    const updatedName = "New User";
    const updatedPhone = "87654321";
    const updatedAddress = "13 Computing Drive";

    // login
    await login(page);

    // go to dashboard page
    await page.getByTestId("user-name-dropdown").click();
    await page.getByRole("link", { name: "Dashboard" }).click();

    // view profile
    await expect(
      page.getByRole("heading", { name: `User Name : ${mockUser.name}` })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: `User Email : ${mockUser.email}` })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: `User Contact : ${mockUser.phone}` })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: `User Address : ${mockUser.address}` })
    ).toBeVisible();

    // go to profile page
    await page.getByRole("link", { name: "Profile" }).click();

    // update profile
    await page.getByRole("textbox", { name: "Enter Your Name" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Name" })
      .fill(updatedName);
    await page
      .getByRole("textbox", { name: "Enter Your Phone" })
      .fill(updatedPhone);
    await page
      .getByRole("textbox", { name: "Enter Your Address" })
      .fill(updatedAddress);
    await page.getByRole("button", { name: "UPDATE" }).click();

    await expect(page.getByText("Profile Updated Successfully")).toBeVisible();

    // go to dashboard page
    await page.getByTestId("user-name-dropdown").click();
    await page.getByRole("link", { name: "Dashboard" }).click();

    // view updated profile
    await expect(
      page.getByRole("heading", { name: `User Name : ${updatedName}` })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: `User Email : ${mockUser.email}` })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: `User Contact : ${updatedPhone}` })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: `User Address : ${updatedAddress}` })
    ).toBeVisible();
  });

  test("should allow user to update and login with new password", async ({
    page,
  }) => {
    const updatedPassword = "newpassword456";

    // login
    await login(page);

    // go to profile page
    await page.getByTestId("user-name-dropdown").click();
    await page.getByRole("link", { name: "Dashboard" }).click();
    await page.getByRole("link", { name: "Profile" }).click();

    // update password
    await page
      .getByRole("textbox", { name: "Enter Your Password" })
      .fill(updatedPassword);
    await page.getByRole("button", { name: "UPDATE" }).click();

    await expect(page.getByText("Profile Updated Successfully")).toBeVisible();

    // logout
    await page.getByTestId("user-name-dropdown").click();
    await page.getByRole("link", { name: "Logout" }).click();

    // login with updated password
    await page
      .getByRole("textbox", { name: "Enter Your Email" })
      .fill(mockUser.email);
    await page
      .getByRole("textbox", { name: "Enter Your Password" })
      .fill(updatedPassword);
    await page.getByRole("button", { name: "LOGIN" }).click();

    await expect(page.getByText("Login successfully!")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "All Products", exact: true })
    ).toBeVisible();
  });

  test("should redirect unauthenticated user from dashboard page to home page", async ({
    page,
  }) => {
    expect(page.getByTestId("user-name-dropdown")).toHaveCount(0);

    // go to dashboard page
    await page.goto("/dashboard/user");

    await expect(page.getByRole("heading", { name: "Dashboard" })).toHaveCount(
      0
    );

    // wait for redirection to home page
    await page.waitForURL("/");

    await expect(
      page.getByRole("heading", { name: "All Products", exact: true })
    ).toBeVisible();
  });

  test("should redirect unauthenticated user from profile page to home page", async ({
    page,
  }) => {
    // go to profile page
    await page.goto("/dashboard/user/profile");

    await expect(
      page.getByRole("heading", { name: "USER PROFILE" })
    ).toHaveCount(0);

    // wait for redirection to home page
    await page.waitForURL("/");

    await expect(
      page.getByRole("heading", { name: "All Products", exact: true })
    ).toBeVisible();
  });
});
