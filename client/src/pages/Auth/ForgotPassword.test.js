import React from "react";
import { screen, render, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import toast from "react-hot-toast";
import ForgotPassword from "./ForgotPassword";

jest.mock("axios");
jest.mock("react-hot-toast");

const mockNavigate = jest.fn();

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../../context/cart", () => ({
  useCart: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../../context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]),
}));

jest.mock("../../context/category", () => ({
  useCategory: jest.fn(() => [[], jest.fn()]),
}));

jest.spyOn(console, "log").mockImplementation(() => {});

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: jest.fn(),
  useNavigate: () => mockNavigate,
}));

const renderForgotPasswordPage = () => {
  return render(
    <MemoryRouter>
      <ForgotPassword />
    </MemoryRouter>
  );
};
const fillAndSubmitForgotPasswordForm = (email = "test@example.com") => {
  const newPassword = "password123";
  const answer = "Football";
  fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
    target: { value: email },
  });
  fireEvent.change(
    screen.getByPlaceholderText("What is Your Favorite sports"),
    {
      target: { value: answer },
    }
  );
  fireEvent.change(screen.getByPlaceholderText("Enter Your New Password"), {
    target: { value: newPassword },
  });
  fireEvent.click(screen.getByText("RESET PASSWORD"));
};

describe("Forgot Password Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should reset password successfully", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    renderForgotPasswordPage();
    fillAndSubmitForgotPasswordForm();

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith(
      "Password Reset Successfully, please login"
    );
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  it("should display error message on incorrect email or answer", async () => {
    const errorMessage = "Wrong email or answer";
    axios.post.mockResolvedValueOnce({
      data: {
        success: false,
        message: errorMessage,
      },
    });

    renderForgotPasswordPage();
    fillAndSubmitForgotPasswordForm();

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith(errorMessage);
  });

  it("should not allow form submission on empty field", async () => {
    renderForgotPasswordPage();
    fillAndSubmitForgotPasswordForm("");

    await waitFor(() => expect(axios.post).not.toHaveBeenCalled());
  });

  it("should not allow form submission on invalid field", async () => {
    renderForgotPasswordPage();
    fillAndSubmitForgotPasswordForm("test.com");

    await waitFor(() => expect(axios.post).not.toHaveBeenCalled());
  });

  it("should display error message on invalid input in server", async () => {
    const errorMessage = "Something went wrong";
    axios.post.mockRejectedValueOnce({
      data: {
        success: false,
        message: errorMessage,
      },
    });

    renderForgotPasswordPage();
    fillAndSubmitForgotPasswordForm();

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith(errorMessage);
  });
});
