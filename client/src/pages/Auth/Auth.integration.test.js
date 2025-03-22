import React from "react";
import { screen, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios, { AxiosError } from "axios";
import toast from "react-hot-toast";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom";

import Register from "./Register";
import ForgotPassword from "./ForgotPassword";
import Login from "./Login";
import HomePage from "../HomePage";

import { AuthProvider } from "../../context/auth";
import { CartProvider } from "../../context/cart";
import { SearchProvider } from "../../context/search";

jest.mock("axios");
jest.mock("react-hot-toast");
jest.mock("../../context/category", () => ({
  useCategory: jest.fn(() => [[], jest.fn()]),
}));

const testUser = {
  id: 1,
  name: "John Doe",
  email: "test@example.com",
  password: "testpassword",
  phone: "91231234",
  address: "123 Street",
  dob: "2000-01-01",
  answer: "Football",
  cart: [],
};

const newPassword = "newPassword";
const mockAuthToken = "mockAuthToken";

// API Endpoints
const LOGIN_URL = "/api/v1/auth/login";
const REGISTER_URL = "/api/v1/auth/register";
const FORGOT_PASS_URL = "/api/v1/auth/forgot-password";

const renderPage = (page) => {
  return render(
    <MemoryRouter initialEntries={[page]}>
      <AuthProvider>
        <SearchProvider>
          <CartProvider>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
            </Routes>
          </CartProvider>
        </SearchProvider>
      </AuthProvider>
    </MemoryRouter>
  );
};

const axiosMockSuccess = () => {
  axios.post.mockImplementation((url) => {
    if (url.includes(LOGIN_URL)) {
      return Promise.resolve({
        data: { success: true, user: testUser, token: mockAuthToken },
      });
    } else if (url.includes(REGISTER_URL)) {
      return Promise.resolve({ data: { success: true } });
    } else if (url.includes(FORGOT_PASS_URL)) {
      return Promise.resolve({ data: { success: true } });
    }
    return Promise.reject(new AxiosError("URL Not Found"));
  });
};

const axiosMockFailure = () => {
  axios.post.mockImplementation((url) => {
    if (url.includes(LOGIN_URL)) {
      return Promise.resolve({ data: { success: false, message: "Invalid Credentials" } });
    } else if (url.includes(REGISTER_URL)) {
      return Promise.resolve({ data: { success: false, message: "Test Error" } });
    } else if (url.includes(FORGOT_PASS_URL)) {
      return Promise.resolve({ data: { success: false, message: "Test Error" } });
    }
    return Promise.reject(new AxiosError("URL Not Found"));
  });
};

const fillAndSubmitRegistrationForm = async (user) => {
  await user.type(screen.getByPlaceholderText("Enter Your Name"), testUser.name);
  await user.type(screen.getByPlaceholderText("Enter Your Email"), testUser.email);
  await user.type(screen.getByPlaceholderText("Enter Your Password"), testUser.password);
  await user.type(screen.getByPlaceholderText("Enter Your Phone"), testUser.phone);
  await user.type(screen.getByPlaceholderText("Enter Your Address"), testUser.address);
  await user.type(screen.getByPlaceholderText("Enter Your DOB"), testUser.dob);
  await user.type(screen.getByPlaceholderText("What is Your Favorite sports"), testUser.answer);
  await user.click(screen.getByRole("button", { name: "REGISTER" }));
};

const fillAndSubmitLoginForm = async (user) => {
  await user.type(screen.getByPlaceholderText("Enter Your Email"), testUser.email);
  await user.type(screen.getByPlaceholderText("Enter Your Password"), testUser.password);
  await user.click(screen.getByRole("button", { name: "LOGIN" }));
};

const fillAndSubmitForgotPasswordForm = async (user) => {
  await user.type(screen.getByPlaceholderText("Enter Your Email"), testUser.email);
  await user.type(screen.getByPlaceholderText("What is Your Favorite sports"), testUser.answer);
  await user.type(screen.getByPlaceholderText("Enter Your New Password"), newPassword);
  await user.click(screen.getByRole("button", { name: "RESET PASSWORD" }));
};

const expectAxiosCall = (url) => {
  if (url === REGISTER_URL) {
    expect(axios.post).toHaveBeenCalledWith(REGISTER_URL, {
      name: testUser.name,
      email: testUser.email,
      password: testUser.password,
      phone: testUser.phone,
      address: testUser.address,
      DOB: testUser.dob,
      answer: testUser.answer,
    });
  } else if (url === LOGIN_URL) {
    expect(axios.post).toHaveBeenCalledWith(LOGIN_URL, {
      email: testUser.email,
      password: testUser.password,
    });
  } else if (url === FORGOT_PASS_URL) {
    expect(axios.post).toHaveBeenCalledWith(FORGOT_PASS_URL, {
      email: testUser.email,
      answer: testUser.answer,
      newPassword: newPassword,
    });
  }
};

describe("Auth Integration Tests", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe("Registration and Login Integration Test", () => {
    it("should registers a new user and then successfully logs them in", async () => {
      axiosMockSuccess();
      renderPage("/register");

      await fillAndSubmitRegistrationForm(user);
      expectAxiosCall(REGISTER_URL);
      expect(toast.success).toHaveBeenCalledWith("Register Successfully, please login");
      expect(screen.getByText("LOGIN FORM")).toBeInTheDocument();

      await fillAndSubmitLoginForm(user);
      expectAxiosCall(LOGIN_URL);

      expect(toast.success).toHaveBeenCalledWith(undefined, {
        duration: 5000,
        icon: "🙏",
        style: {
          background: "green",
          color: "white",
        },
      });
    });

    it("should fail to register a user and prevent subsequent login", async () => {
      axiosMockFailure();
      renderPage("/register");

      await fillAndSubmitRegistrationForm(user);
      expectAxiosCall(REGISTER_URL);
      expect(toast.error).toHaveBeenCalledWith("Test Error");

      await user.click(screen.getByRole("link", { name: "Login" }));
      await fillAndSubmitLoginForm(user);
      expectAxiosCall(LOGIN_URL);
      expect(toast.error).toHaveBeenCalledWith("Invalid Credentials");
    });
  });

  describe("Forgot Password and Login Integration Test", () => {
    it("should reset the password and logs the user in successfully", async () => {
      axiosMockSuccess();
      renderPage("/forgot-password");

      await fillAndSubmitForgotPasswordForm(user);
      expectAxiosCall(FORGOT_PASS_URL);
      expect(toast.success).toHaveBeenCalledWith("Password Reset Successfully, please login");

      await fillAndSubmitLoginForm(user);
      expectAxiosCall(LOGIN_URL);

      expect(toast.success).toHaveBeenCalledWith(undefined, {
        duration: 5000,
        icon: "🙏",
        style: {
          background: "green",
          color: "white",
        },
      });
    });
    it("should fail to reset the password and prevent subsequent login", async () => {
      axiosMockFailure();
      renderPage("/forgot-password");

      await fillAndSubmitForgotPasswordForm(user);
      expectAxiosCall(FORGOT_PASS_URL);
      expect(toast.error).toHaveBeenCalledWith("Test Error");

      await user.click(screen.getByRole("link", { name: "Login" }));
      await fillAndSubmitLoginForm(user);
      expectAxiosCall(LOGIN_URL);
      expect(toast.error).toHaveBeenCalledWith("Invalid Credentials");
    });
  });

  describe("Login and LocalStorage Integration Test", () => {
    it("should store the auth token in localStorage upon successful login", async () => {
      axiosMockSuccess();
      renderPage("/login");

      await fillAndSubmitLoginForm(user);
      expectAxiosCall(LOGIN_URL);
      expect(JSON.parse(localStorage.getItem("auth"))).toEqual({ success: true, user: testUser, token: mockAuthToken });
    });

    it("should leave localStorage empty when login fails", async () => {
      axiosMockFailure();
      renderPage("/login");

      await fillAndSubmitLoginForm(user);
      expectAxiosCall(LOGIN_URL);
      expect(JSON.parse(localStorage.getItem("auth"))).toBeNull();
    });
  });

  describe("Login and Home Page Integration Test", () => {
    it("should display the user name on the home page after a successful login", async () => {
      axiosMockSuccess();
      renderPage("/login");

      await fillAndSubmitLoginForm(user);
      expectAxiosCall(LOGIN_URL);
      expect(screen.getByText(testUser.name)).toBeInTheDocument();
    });
    it("should stay on the login page when authentication fails", async () => {
      axiosMockFailure();
      renderPage("/login");

      await fillAndSubmitLoginForm(user);
      expectAxiosCall(LOGIN_URL);
      expect(screen.getByText("LOGIN FORM")).toBeInTheDocument();
    });
  });

  describe("Navigation Integration Test", () => {
    it("should navigate from login to forgot password page", async () => {
      renderPage("/login");
      await user.click(screen.getByRole("button", { name: "Forgot Password" }));
      expect(screen.getByText("FORGOT PASSWORD")).toBeInTheDocument();
    });
    it("should navigate from login to registration page", async () => {
      renderPage("/login");
      await user.click(screen.getByRole("link", { name: "Register" }));
      expect(screen.getByText("REGISTER FORM")).toBeInTheDocument();
    });
    it("should navigate from registration to login page", async () => {
      renderPage("/register");
      await user.click(screen.getByRole("link", { name: "Login" }));
      expect(screen.getByText("LOGIN FORM")).toBeInTheDocument();
    });
    it("should navigate from forgot password to login page", async () => {
      renderPage("/forgot-password");
      await user.click(screen.getByRole("link", { name: "Login" }));
      expect(screen.getByText("LOGIN FORM")).toBeInTheDocument();
    });
    it("should navigate from forgot password to registration page", async () => {
      renderPage("/forgot-password");
      await user.click(screen.getByRole("link", { name: "Register" }));
      expect(screen.getByText("REGISTER FORM")).toBeInTheDocument();
    });
  });
});
