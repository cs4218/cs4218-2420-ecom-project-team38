import React from "react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { screen, render } from "@testing-library/react";
import Header from "./Header";
import { MemoryRouter } from "react-router-dom";
import { useAuth } from "../context/auth";
import toast from "react-hot-toast";

jest.mock("react-hot-toast");

jest.mock("../context/auth", () => ({
  useAuth: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../context/cart", () => ({
  useCart: jest.fn(() => [["item1", "item2"], jest.fn()]),
}));

jest.mock("../hooks/useCategory", () =>
  jest.fn(() => [
    { name: "category1", slug: "category1" },
    { name: "category2", slug: "category2" },
  ])
);

jest.mock("./Form/SearchInput", () => () => <div>SearchInput</div>);

Object.defineProperty(window, "localStorage", {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

describe("Header Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Should render link to home page", () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    const homepageLink = screen.getByText(/virtual vault/i);
    expect(homepageLink).toBeInTheDocument();
    expect(homepageLink).toHaveAttribute("href", "/");
  });

  it("Should render search input", () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    const searchInput = screen.getByText(/searchinput/i);
    expect(searchInput).toBeInTheDocument();
  });

  it("Should render link to categories", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    await user.click(screen.getByText("Categories"));
    const allCategories = screen.getByRole("link", { name: "All Categories" });
    const category1 = screen.getByRole("link", { name: "category1" });
    const category2 = screen.getByRole("link", { name: "category2" });
    expect(allCategories).toBeInTheDocument();
    expect(allCategories).toHaveAttribute("href", "/categories");
    expect(category1).toBeInTheDocument();
    expect(category1).toHaveAttribute("href", "/category/category1");
    expect(category2).toBeInTheDocument();
    expect(category2).toHaveAttribute("href", "/category/category2");
  });

  it("Should render link to cart page", () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    const cartLink = screen.getByRole("link", { name: "Cart" });
    expect(cartLink).toBeInTheDocument();
    expect(cartLink).toHaveAttribute("href", "/cart");
  });

  it("Should render cart count correctly", () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByText("2")).toBeInTheDocument();
  });

  describe("When user is not authenticated", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("Should render link to register page", () => {
      render(
        <MemoryRouter>
          <Header />
        </MemoryRouter>
      );
      const registerLink = screen.getByRole("link", { name: "Register" });
      expect(registerLink).toBeInTheDocument();
      expect(registerLink).toHaveAttribute("href", "/register");
    });

    it("Should render link to login page", () => {
      render(
        <MemoryRouter>
          <Header />
        </MemoryRouter>
      );
      const loginLink = screen.getByRole("link", { name: "Login" });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute("href", "/login");
    });
  });

  describe("When user is authenticated", () => {
    const mockSetAuth = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
      useAuth.mockImplementation(() => [
        { user: { name: "user", role: 0 } },
        mockSetAuth,
      ]);
    });

    it("Should render user's name", () => {
      render(
        <MemoryRouter>
          <Header />
        </MemoryRouter>
      );
      expect(screen.getByText("user")).toBeInTheDocument();
    });

    describe("When user is not an admin", () => {
      beforeEach(() => {
        jest.clearAllMocks();
        useAuth.mockImplementation(() => [
          { user: { name: "user", role: 0 } },
          mockSetAuth,
        ]);
      });

      it("Should render link to user dashboard", async () => {
        const user = userEvent.setup();

        render(
          <MemoryRouter>
            <Header />
          </MemoryRouter>
        );

        await user.click(screen.getByText("user"));
        const dashboardLink = screen.getByRole("link", { name: "Dashboard" });
        expect(dashboardLink).toBeInTheDocument();
        expect(dashboardLink).toHaveAttribute("href", "/dashboard/user");
      });
    });

    it("Should render logout button", () => {
      render(
        <MemoryRouter>
          <Header />
        </MemoryRouter>
      );
      const logoutButton = screen.getByRole("link", { name: "Logout" });
      expect(logoutButton).toBeInTheDocument();
      expect(logoutButton).toHaveAttribute("href", "/login");
    });

    it("Should log user out when logout button is clicked", async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <Header />
        </MemoryRouter>
      );

      await user.click(screen.getByText("user"));
      await user.click(screen.getByText("Logout"));
      expect(localStorage.removeItem).toHaveBeenCalledWith("auth");
      expect(mockSetAuth).toHaveBeenCalledWith({ user: null, token: "" });
      expect(toast.success).toHaveBeenCalledWith("Logout successfully!");
    });

    describe("When user is an admin", () => {
      beforeEach(() => {
        jest.clearAllMocks();
        useAuth.mockImplementation(() => [
          { user: { name: "admin", role: 1 } },
          jest.fn(),
        ]);
      });

      it("Should render link to admin dashboard", async () => {
        const user = userEvent.setup();

        render(
          <MemoryRouter>
            <Header />
          </MemoryRouter>
        );

        await user.click(screen.getByText("admin"));
        const dashboardLink = screen.getByRole("link", { name: "Dashboard" });
        expect(dashboardLink).toBeInTheDocument();
        expect(dashboardLink).toHaveAttribute("href", "/dashboard/admin");
      });
    });
  });
});
