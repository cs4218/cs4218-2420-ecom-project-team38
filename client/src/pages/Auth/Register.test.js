import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom";
import toast from "react-hot-toast";
import Register from "./Register";

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

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: jest.fn(),
  useNavigate: () => mockNavigate,
}));

Object.defineProperty(window, "localStorage", {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

window.matchMedia =
  window.matchMedia ||
  function () {
    return {
      matches: false,
      addListener: function () {},
      removeListener: function () {},
    };
  };

const renderRegistrationPage = () => {
  return render(
    <MemoryRouter initialEntries={["/register"]}>
      <Routes>
        <Route path="/register" element={<Register />} />
      </Routes>
    </MemoryRouter>
  );
};

const fillAndSubmitRegistrationForm = (
  getByPlaceholderText,
  getByText,
  {
    name = "John Doe",
    email = "test@example.com",
    password = "password123",
    phone = "1234567890",
    address = "123 Street",
    dob = "2000-01-01",
    sport = "Football",
  } = {}
) => {
  fireEvent.change(getByPlaceholderText("Enter Your Name"), {
    target: { value: name },
  });
  fireEvent.change(getByPlaceholderText("Enter Your Email"), {
    target: { value: email },
  });
  fireEvent.change(getByPlaceholderText("Enter Your Password"), {
    target: { value: password },
  });
  fireEvent.change(getByPlaceholderText("Enter Your Phone"), {
    target: { value: phone },
  });
  fireEvent.change(getByPlaceholderText("Enter Your Address"), {
    target: { value: address },
  });
  fireEvent.change(getByPlaceholderText("Enter Your DOB"), {
    target: { value: dob },
  });
  fireEvent.change(getByPlaceholderText("What is Your Favorite sports"), {
    target: { value: sport },
  });

  fireEvent.click(getByText("REGISTER"));
};

describe("Register Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should register the user successfully", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    const { getByText, getByPlaceholderText } = renderRegistrationPage();
    fillAndSubmitRegistrationForm(getByPlaceholderText, getByText, {});

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith(
      "Register Successfully, please login"
    );
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  it("should display error message on failed registration", async () => {
    axios.post.mockRejectedValueOnce({ message: "User already exists" });

    const { getByText, getByPlaceholderText } = renderRegistrationPage();
    fillAndSubmitRegistrationForm(getByPlaceholderText, getByText, {});

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith("Something went wrong");
  });

  it("should not allow form submission on empty field", async () => {
    const { getByText, getByPlaceholderText } = renderRegistrationPage();
    fillAndSubmitRegistrationForm(getByPlaceholderText, getByText, {
      name: "",
    });

    await waitFor(() => expect(axios.post).not.toHaveBeenCalled());
  });

  it("should not allow form submission on invalid field", async () => {
    const { getByText, getByPlaceholderText } = renderRegistrationPage();
    fillAndSubmitRegistrationForm(getByPlaceholderText, getByText, {
      email: "test.com",
    });

    await waitFor(() => expect(axios.post).not.toHaveBeenCalled());
  });

  it("should display error message on invalid input in server", async () => {
    const errorMessage = "invalid input";
    axios.post.mockResolvedValueOnce({
      data: {
        success: false,
        message: errorMessage,
      },
    });

    const { getByText, getByPlaceholderText } = renderRegistrationPage();
    fillAndSubmitRegistrationForm(getByPlaceholderText, getByText, {});

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith(errorMessage);
  });
});
