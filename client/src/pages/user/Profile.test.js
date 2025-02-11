import React from "react";
import { screen, render, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import toast from "react-hot-toast";
import Profile from "./Profile";
import { useAuth } from "../../context/auth";

jest.mock("axios");

jest.mock("react-hot-toast");

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../../context/cart", () => ({
  useCart: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../../context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]),
}));

jest.mock("../../hooks/useCategory", () => jest.fn(() => []));

const mockUseNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockUseNavigate,
}));

Object.defineProperty(window, "localStorage", {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

const renderProfileComponent = () => {
  render(
    <MemoryRouter>
      <Profile />
    </MemoryRouter>
  );
};

describe("Profile Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("User is logged in", () => {
    let mockUser;

    beforeEach(() => {
      mockUser = {
        name: "Test User",
        email: "testuser@gmail.com",
        password: "testpassword123",
        phone: "98765432",
        address: "123 Test Address",
      };

      useAuth.mockReturnValue([{ user: mockUser, token: "" }, jest.fn()]);

      window.localStorage.getItem.mockReturnValue(
        JSON.stringify({ user: mockUser })
      );
    });

    describe("Form initialisation", () => {
      it("should render all form fields", () => {
        renderProfileComponent();

        expect(screen.getByText("USER PROFILE")).toBeInTheDocument();
        expect(
          screen.getByPlaceholderText("Enter Your Name")
        ).toBeInTheDocument();
        expect(
          screen.getByPlaceholderText("Enter Your Email")
        ).toBeInTheDocument();
        expect(
          screen.getByPlaceholderText("Enter Your Password")
        ).toBeInTheDocument();
        expect(
          screen.getByPlaceholderText("Enter Your Phone")
        ).toBeInTheDocument();
        expect(
          screen.getByPlaceholderText("Enter Your Address")
        ).toBeInTheDocument();
      });

      it("should prefill all form fields except password with user data", () => {
        renderProfileComponent();

        expect(screen.getByPlaceholderText("Enter Your Name")).toHaveValue(
          mockUser.name
        );
        expect(screen.getByPlaceholderText("Enter Your Email")).toHaveValue(
          mockUser.email
        );
        expect(screen.getByPlaceholderText("Enter Your Phone")).toHaveValue(
          mockUser.phone
        );
        expect(screen.getByPlaceholderText("Enter Your Address")).toHaveValue(
          mockUser.address
        );
      });

      it("should not prefill password form field with user data", () => {
        renderProfileComponent();

        expect(screen.getByPlaceholderText("Enter Your Password")).toHaveValue(
          ""
        );
      });
    });

    describe("Form interaction", () => {
      it("should allow changing of name, password, phone and address", () => {
        const name = "New User";
        const password = "newpassword123";
        const phone = "87654321";
        const address = "456 New Address";

        renderProfileComponent();

        fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
          target: { value: name },
        });
        fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
          target: { value: password },
        });
        fireEvent.change(screen.getByPlaceholderText("Enter Your Phone"), {
          target: { value: phone },
        });
        fireEvent.change(screen.getByPlaceholderText("Enter Your Address"), {
          target: { value: address },
        });

        expect(screen.getByPlaceholderText("Enter Your Name")).toHaveValue(
          name
        );
        expect(screen.getByPlaceholderText("Enter Your Password")).toHaveValue(
          password
        );
        expect(screen.getByPlaceholderText("Enter Your Phone")).toHaveValue(
          phone
        );
        expect(screen.getByPlaceholderText("Enter Your Address")).toHaveValue(
          address
        );
      });

      it("should not allow changing of email", () => {
        const email = "newemail@gmail.com";

        renderProfileComponent();

        fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
          target: { value: email },
        });

        expect(screen.getByPlaceholderText("Enter Your Email")).toHaveValue(
          mockUser.email
        );
      });
    });

    describe("Form submission", () => {
      it("should submit with the correct input values", async () => {
        const newName = "New User";
        const newPassword = "newpassword456";
        const newPhone = "87654321";
        const newAddress = "456 New Address";

        axios.put.mockResolvedValue({ data: {} });

        renderProfileComponent();

        fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
          target: { value: newName },
        });
        fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
          target: { value: newPassword },
        });
        fireEvent.change(screen.getByPlaceholderText("Enter Your Phone"), {
          target: { value: newPhone },
        });
        fireEvent.change(screen.getByPlaceholderText("Enter Your Address"), {
          target: { value: newAddress },
        });
        fireEvent.click(screen.getByRole("button", { name: /update/i }));

        await waitFor(() =>
          expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/profile", {
            name: newName,
            email: mockUser.email,
            password: newPassword,
            phone: newPhone,
            address: newAddress,
          })
        );
      });

      it("should display success message when profile update is successful", async () => {
        const [, setAuth] = useAuth();
        const newName = "New User";
        const newPassword = "newpassword456";
        const newPhone = "87654321";
        const newAddress = "456 New Address";

        const updatedUser = {
          name: newName,
          email: mockUser.email,
          password: newPassword,
          phone: newPhone,
          address: newAddress,
        };

        axios.put.mockResolvedValue({
          data: {
            success: true,
            message: "Profile Updated Successfully",
            updatedUser: { ...updatedUser },
          },
        });

        renderProfileComponent();

        fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
          target: { value: newName },
        });
        fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
          target: { value: newPassword },
        });
        fireEvent.change(screen.getByPlaceholderText("Enter Your Phone"), {
          target: { value: newPhone },
        });
        fireEvent.change(screen.getByPlaceholderText("Enter Your Address"), {
          target: { value: newAddress },
        });
        fireEvent.click(screen.getByRole("button", { name: /update/i }));

        await waitFor(() =>
          expect(setAuth).toHaveBeenCalledWith({
            user: updatedUser,
            token: "",
          })
        );
        expect(localStorage.setItem).toHaveBeenCalledWith(
          "auth",
          JSON.stringify({ user: updatedUser })
        );
        expect(toast.success).toHaveBeenCalledWith(
          "Profile Updated Successfully"
        );
      });

      it("should display error message when profile update fails due to invalid input", async () => {
        const [, setAuth] = useAuth();
        const errorMsg = "Invalid input";

        axios.put.mockResolvedValue({
          data: {
            error: errorMsg,
          },
        });

        renderProfileComponent();

        fireEvent.click(screen.getByRole("button", { name: /update/i }));

        await waitFor(() => expect(setAuth).not.toHaveBeenCalled());
        expect(localStorage.setItem).not.toHaveBeenCalled();
        expect(toast.error).toHaveBeenCalledWith(errorMsg);
      });

      it("should display error message when profile update fails due to backend error", async () => {
        const [, setAuth] = useAuth();

        axios.put.mockRejectedValue({});

        renderProfileComponent();

        fireEvent.click(screen.getByRole("button", { name: /update/i }));

        await waitFor(() => expect(setAuth).not.toHaveBeenCalled());
        expect(localStorage.setItem).not.toHaveBeenCalled();
        expect(toast.error).toHaveBeenCalledWith("Something went wrong");
      });
    });
  });

  describe("User is not logged in", () => {
    beforeEach(() => {
      useAuth.mockReturnValue([{ user: null, token: "" }, jest.fn()]);
    });

    it("should navigate to home page", () => {
      renderProfileComponent();

      expect(mockUseNavigate).toHaveBeenCalledWith("/");
    });
  });
});
