import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import CategoryProduct from "./CategoryProduct";
import { useParams, useNavigate } from "react-router-dom";
import { useCart } from "../context/cart";
import { toast } from "react-hot-toast";

import "@testing-library/jest-dom";

jest.mock("axios");
jest.mock("react-hot-toast");

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));

jest.mock("../context/auth", () => ({
  useAuth: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../context/cart", () => ({
  useCart: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../context/category", () => ({
  useCategory: jest.fn(() => [[], jest.fn()]),
}));

Object.defineProperty(window, "localStorage", {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

jest.mock("../components/Form/SearchInput", () => () => (
  <div>Mocked SearchInput</div>
));

describe("CategoryProduct Component", () => {
  beforeEach(() => {
    useParams.mockReturnValue({ slug: "test-category" });
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.clearAllMocks();
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  it("Correctly displays products belonging to the category", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("product-category/test-category")) {
        return Promise.resolve({
          data: {
            products: [
              {
                _id: "12345",
                name: "Test Product 1",
                description: "This is a test product",
                price: 10.0,
                category: { _id: "10", name: "Test Category" },
                slug: "test-product-1",
              },
              {
                _id: "12346",
                name: "Test Product 2",
                description:
                  "This is another test product with an insanely long description",
                price: 20.0,
                category: { _id: "10", name: "Test Category" },
                slug: "test-product-2",
              },
            ],
          },
        });
      }

      return Promise.reject(new Error("Not Found"));
    });

    render(
      <MemoryRouter>
        <CategoryProduct />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("2 result found")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Test Product 1")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("This is a test product")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Test Product 2")).toBeInTheDocument();
    });

    await waitFor(() => {
      const truncatedDescription =
        "This is another test product with an insanely long description".substring(
          0,
          60
        ) + "...";
      expect(screen.getByText(truncatedDescription)).toBeInTheDocument();
    });

    await waitFor(() => {
      const moreDetailsButtons = screen.getAllByRole("button", {
        name: /more details/i,
      });
      expect(moreDetailsButtons.length).toBe(2);
    });
  });

  it("Displays no results found when a category has no products", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("product-category/test-category")) {
        return Promise.resolve({
          data: {
            products: [],
          },
        });
      }

      return Promise.reject(new Error("Not Found"));
    });

    render(
      <MemoryRouter>
        <CategoryProduct />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("0 result found")).toBeInTheDocument();
    });
  });

  it("Raises an error when an exception occurs from fetching products by category", async () => {
    axios.get.mockRejectedValue(new Error("Failed to fetch products"));

    render(
      <MemoryRouter>
        <CategoryProduct />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(expect.any(Error));
    });

    expect(screen.queryByText("Test Product 1")).not.toBeInTheDocument();
    expect(screen.queryByText("Test Product 2")).not.toBeInTheDocument();
  });

  it("Should not call getProductsByCategory hook when slug is missing", () => {
    useParams.mockReturnValue({});

    render(
      <MemoryRouter>
        <CategoryProduct />
      </MemoryRouter>
    );

    expect(axios.get).not.toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/product/product-category/")
    );
  });

  it("Navigates to the product details page when the 'More Details' button is clicked", async () => {
    const navigate = jest.fn();
    useNavigate.mockReturnValue(navigate);

    axios.get.mockImplementation((url) => {
      if (url.includes("product-category/test-category")) {
        return Promise.resolve({
          data: {
            products: [
              {
                _id: "12345",
                name: "Test Product 1",
                description: "This is a test product",
                price: 10.0,
                category: { _id: "10", name: "Test Category" },
                slug: "test-product-1",
              },
            ],
          },
        });
      }

      return Promise.reject(new Error("Not Found"));
    });

    render(
      <MemoryRouter>
        <CategoryProduct />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Test Product 1")).toBeInTheDocument();
    });

    const moreDetailsButton = screen.getByRole("button", {
      name: /more details/i,
    });
    fireEvent.click(moreDetailsButton);

    expect(navigate).toHaveBeenCalledWith("/product/test-product-1");
  });

  it("Adds product to cart when 'ADD TO CART' button is clicked", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("product-category/test-category")) {
        return Promise.resolve({
          data: {
            products: [
              {
                _id: "12345",
                name: "Test Product 1",
                description: "This is a test product",
                price: 10.0,
                category: { _id: "10", name: "Test Category" },
                slug: "test-category",
              },
              {
                _id: "12346",
                name: "Test Product 2",
                description: "This is another test product",
                price: 20.0,
                category: { _id: "10", name: "Test Category" },
                slug: "test-category",
              },
            ],
          },
        });
      }
      return Promise.reject(new Error("Not Found"));
    });

    const mockSetCart = jest.fn();
    useCart.mockReturnValue([[], mockSetCart]);

    render(
      <MemoryRouter initialEntries={["/category/test-category"]}>
        <CategoryProduct />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Test Product 1")).toBeInTheDocument();
    });

    const moreAddToCartButtons = screen.getAllByText("ADD TO CART");
    fireEvent.click(moreAddToCartButtons[0]);

    expect(mockSetCart).toHaveBeenCalledWith([
      {
        _id: "12345",
        name: "Test Product 1",
        description: "This is a test product",
        price: 10.0,
        category: { _id: "10", name: "Test Category" },
        slug: "test-category",
      },
    ]);

    expect(localStorage.setItem).toHaveBeenCalledWith(
      "cart",
      JSON.stringify([
        {
          _id: "12345",
          name: "Test Product 1",
          description: "This is a test product",
          price: 10.0,
          category: { _id: "10", name: "Test Category" },
          slug: "test-category",
        },
      ])
    );

    expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
  });
});
