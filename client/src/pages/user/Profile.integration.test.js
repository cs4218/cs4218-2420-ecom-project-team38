import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Profile from "./Profile";
import Dashboard from "./Dashboard";
import axios from "axios";
import { AuthProvider } from "../../context/auth";
import CartPage from "../CartPage";

jest.mock("axios");

jest.mock("../../context/cart", () => ({
  useCart: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../../context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]),
}));

jest.mock("../../hooks/useCategory", () => jest.fn(() => []));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => jest.fn(),
}));

describe("Profile page integration test", () => {
  const mockUser = {
    name: "Test User",
    email: "testuser@gmail.com",
    password: "testpassword123",
    phone: "98765432",
    address: "123 Test Address",
  };

  beforeEach(() => {
    jest.clearAllMocks();

    localStorage.clear();
    localStorage.setItem(
      "auth",
      JSON.stringify({ user: mockUser, token: "testtoken" })
    );
  });

  describe("With user name header dropdown", () => {
    const renderProfilePage = () => {
      render(
        <AuthProvider>
          <MemoryRouter>
            <Profile />
          </MemoryRouter>
        </AuthProvider>
      );
    };

    it("should display the updated user name in the header dropdown", async () => {
      const updatedName = "New User";
      axios.put.mockResolvedValue({
        data: { updatedUser: { ...mockUser, name: updatedName } },
      });

      renderProfilePage();

      fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
        target: { value: updatedName },
      });
      fireEvent.click(screen.getByRole("button", { name: /update/i }));

      expect(await screen.findByTestId("user-name-dropdown")).toHaveTextContent(
        updatedName
      );
    });
  });

  describe("With dashboard page", () => {
    const renderProfilePage = () => {
      render(
        <AuthProvider>
          <MemoryRouter initialEntries={["/dashboard/user/profile"]}>
            <Routes>
              <Route path="/dashboard/user/profile" element={<Profile />} />
              <Route path="/dashboard/user" element={<Dashboard />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      );
    };

    it("should display the updated user profile in the dashboard page", async () => {
      const updatedName = "New User";
      const updatedAddress = "456 New Address";
      axios.put.mockResolvedValue({
        data: {
          updatedUser: {
            ...mockUser,
            name: updatedName,
            address: updatedAddress,
          },
        },
      });

      renderProfilePage();

      fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
        target: { value: updatedName },
      });
      fireEvent.change(screen.getByPlaceholderText("Enter Your Address"), {
        target: { value: updatedAddress },
      });
      fireEvent.click(screen.getByRole("button", { name: /update/i }));
      fireEvent.click(screen.getByTestId("user-name-dropdown"));
      fireEvent.click(screen.getByRole("link", { name: /dashboard/i }));

      expect(
        await screen.findByText(`User Name : ${updatedName}`)
      ).toBeInTheDocument();
      expect(
        await screen.findByText(`User Email : ${mockUser.email}`)
      ).toBeInTheDocument();
      expect(
        await screen.findByText(`User Address : ${updatedAddress}`)
      ).toBeInTheDocument();
    });
  });

  describe("With cart page", () => {
    const renderProfilePage = () => {
      render(
        <AuthProvider>
          <MemoryRouter initialEntries={["/dashboard/user/profile"]}>
            <Routes>
              <Route path="/dashboard/user/profile" element={<Profile />} />
              <Route path="/cart" element={<CartPage />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      );
    };

    it("should display the updated user name and address in the cart page", async () => {
      const updatedName = "New User";
      const updatedAddress = "456 New Address";
      axios.put.mockResolvedValue({
        data: {
          updatedUser: {
            ...mockUser,
            name: updatedName,
            address: updatedAddress,
          },
        },
      });

      renderProfilePage();

      fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
        target: { value: updatedName },
      });
      fireEvent.change(screen.getByPlaceholderText("Enter Your Address"), {
        target: { value: updatedAddress },
      });
      fireEvent.click(screen.getByRole("button", { name: /update/i }));
      fireEvent.click(screen.getByRole("link", { name: /cart/i }));

      expect(
        await screen.findByText(`Hello ${updatedName}`)
      ).toBeInTheDocument();
      expect(await screen.findByText(updatedAddress)).toBeInTheDocument();
    });
  });
});
