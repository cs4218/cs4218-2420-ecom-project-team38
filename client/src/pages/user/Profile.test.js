import React from "react";
import { screen, render, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import toast from "react-hot-toast";
import Profile from "./Profile";
import { useAuth } from "../../context/auth";

jest.mock("axios");

jest.mock("react-hot-toast");

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

jest.mock("../../components/UserMenu", () =>
  jest.fn(() => <div>Mock User Menu</div>)
);

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

jest.spyOn(console, "log").mockImplementation(() => {});

describe("Profile Page", () => {
  const renderProfilePage = () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("User is authenticated", () => {
    const mockToken = "testtoken";
    let mockUser;

    beforeEach(() => {
      mockUser = {
        name: "Test User",
        email: "testuser@gmail.com",
        password: "testpassword123",
        phone: "98765432",
        address: "123 Test Address",
      };

      useAuth.mockReturnValue([
        { user: mockUser, token: mockToken },
        jest.fn(),
      ]);

      window.localStorage.getItem.mockReturnValue(
        JSON.stringify({ user: mockUser })
      );
    });

    describe("Page initialisation", () => {
      it("should render the user menu", () => {
        renderProfilePage();

        expect(screen.getByText("Mock User Menu")).toBeInTheDocument();
      });

      it("should render form title and all form fields", () => {
        renderProfilePage();

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
        renderProfilePage();

        expect(screen.getByPlaceholderText("Enter Your Name")).toHaveValue(
          mockUser.name
        );
        expect(screen.getByPlaceholderText("Enter Your Email")).toHaveValue(
          mockUser.email
        );
        expect(screen.getByPlaceholderText("Enter Your Password")).toHaveValue(
          ""
        );
        expect(screen.getByPlaceholderText("Enter Your Phone")).toHaveValue(
          mockUser.phone
        );
        expect(screen.getByPlaceholderText("Enter Your Address")).toHaveValue(
          mockUser.address
        );
      });
    });

    describe("Form interaction", () => {
      it("should allow changing of name", () => {
        const name = "New User";

        renderProfilePage();

        fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
          target: { value: name },
        });

        expect(screen.getByPlaceholderText("Enter Your Name")).toHaveValue(
          name
        );
      });

      it("should not allow changing of email", () => {
        const email = "newemail@gmail.com";

        renderProfilePage();

        fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
          target: { value: email },
        });

        expect(screen.getByPlaceholderText("Enter Your Email")).toHaveValue(
          mockUser.email
        );
      });

      it("should allow changing of password", () => {
        const password = "newpassword123";

        renderProfilePage();

        fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
          target: { value: password },
        });

        expect(screen.getByPlaceholderText("Enter Your Password")).toHaveValue(
          password
        );
      });

      it("should not allow password to have trailing white spaces", () => {
        renderProfilePage();

        fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
          target: { value: "  newpassword123  " },
        });

        expect(screen.getByPlaceholderText("Enter Your Password")).toHaveValue(
          "newpassword123"
        );
      });

      it("should allow changing of phone", () => {
        const phone = "87654321";

        renderProfilePage();

        fireEvent.change(screen.getByPlaceholderText("Enter Your Phone"), {
          target: { value: phone },
        });

        expect(screen.getByPlaceholderText("Enter Your Phone")).toHaveValue(
          phone
        );
      });

      it("should not allow phone to have trailing white spaces", () => {
        renderProfilePage();

        fireEvent.change(screen.getByPlaceholderText("Enter Your Phone"), {
          target: { value: "  87654321  " },
        });

        expect(screen.getByPlaceholderText("Enter Your Phone")).toHaveValue(
          "87654321"
        );
      });

      it("should allow changing of address", () => {
        const address = "456 New Address";

        renderProfilePage();

        fireEvent.change(screen.getByPlaceholderText("Enter Your Address"), {
          target: { value: address },
        });

        expect(screen.getByPlaceholderText("Enter Your Address")).toHaveValue(
          address
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

        renderProfilePage();

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

        renderProfilePage();

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
            token: mockToken,
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

        renderProfilePage();

        fireEvent.click(screen.getByRole("button", { name: /update/i }));

        await waitFor(() => expect(setAuth).not.toHaveBeenCalled());
        expect(localStorage.setItem).not.toHaveBeenCalled();
        expect(toast.error).toHaveBeenCalledWith(errorMsg);
      });

      it("should display error message when profile update fails due to backend error", async () => {
        const [, setAuth] = useAuth();

        axios.put.mockRejectedValue(new Error("Backend error"));

        renderProfilePage();

        fireEvent.click(screen.getByRole("button", { name: /update/i }));

        await waitFor(() => expect(setAuth).not.toHaveBeenCalled());
        expect(localStorage.setItem).not.toHaveBeenCalled();
        expect(toast.error).toHaveBeenCalledWith("Something went wrong");
      });
    });
  });

  describe("User is unauthenticated", () => {
    beforeEach(() => {
      useAuth.mockReturnValue([null, jest.fn()]);
    });

    it("should navigate to home page", () => {
      renderProfilePage();

      expect(mockUseNavigate).toHaveBeenCalledWith("/");
    });
  });
});
