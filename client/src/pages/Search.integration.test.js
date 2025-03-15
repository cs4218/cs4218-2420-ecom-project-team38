import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Search from "./Search";
import SearchInput from "../components/Form/SearchInput";
import { SearchProvider } from "../context/search";
import { CartProvider } from "../context/cart";
import axios from "axios";
import { AuthProvider } from "../context/auth";
import toast from "react-hot-toast";
import CartPage from "./CartPage";

jest.mock("axios");

jest.mock("react-hot-toast");

describe("Search page integration test", () => {
  const mockProducts = [
    {
      _id: 1,
      name: "Test product 1",
      price: 100,
      description: "This is a product description with more than 30 characters",
      slug: "test-product-1",
    },
    {
      _id: 2,
      name: "Test product 2",
      price: 10,
      description: "Second test product!",
      slug: "test-product-2",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    axios.get.mockResolvedValue({ data: mockProducts });
  });

  it("Should display search results when the user submits a query", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/"]}>
        <AuthProvider>
          <SearchProvider>
            <CartProvider>
              <Routes>
                <Route path="/" element={<SearchInput />} />
                <Route path="/search" element={<Search />} />
              </Routes>
            </CartProvider>
          </SearchProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText("Search"), "Test product");
    await user.click(screen.getByRole("button", { name: "Search" }));
    await waitFor(() =>
      expect(screen.getByText("Found 2")).toBeInTheDocument()
    );
    expect(screen.getByText("Test product 1")).toBeInTheDocument();
    expect(screen.getByText("Test product 2")).toBeInTheDocument();
  });

  it("Should add a product to the cart when the user clicks the Add to Cart button", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/search"]}>
        <AuthProvider>
          <SearchProvider>
            <CartProvider>
              <Routes>
                <Route path="/" element={<SearchInput />} />
                <Route path="/search" element={<Search />} />
                <Route path="/cart" element={<CartPage />} />
              </Routes>
            </CartProvider>
          </SearchProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText("Search"), "Test product");
    await user.click(screen.getByRole("button", { name: "Search" }));
    await waitFor(() =>
      expect(screen.getByText("Found 2")).toBeInTheDocument()
    );

    const addToCartButton = screen.getAllByRole("button", {
      name: "ADD TO CART",
    })[0];
    await user.click(addToCartButton);
    await user.click(screen.getByRole("link", { name: "Cart" }));

    expect(toast.success).toBeCalled();
    expect(screen.getByTestId("cart-items").children.length).toBe(1);
    expect(screen.getByText(mockProducts[0].name)).toBeInTheDocument();
  });
});
