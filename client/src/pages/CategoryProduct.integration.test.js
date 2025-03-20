import React from "react";
import "@testing-library/jest-dom";
import axios from "axios";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import CategoryProduct from "./CategoryProduct";
import { CartProvider } from "../context/cart";
import { AuthProvider } from "../context/auth";
import toast from "react-hot-toast";
import CartPage from "./CartPage";
import { useCategory } from "../context/category";

jest.mock("axios");
jest.mock("react-hot-toast");

jest.mock("../context/category", () => ({
  useCategory: jest.fn(() => []),
}));

jest.mock("../components/Form/SearchInput", () => () => <div>Mocked SearchInput</div>);

describe("Category Products integration test", () => {
  const mockProducts = [
    {
      _id: 1,
      name: "Test product 1",
      price: 100,
      description: "First test product",
      slug: "test-product-1",
      category: { _id: 1, name: "Test Category" },
    },
    {
      _id: 2,
      name: "Test product 2",
      price: 200,
      description: "Second test product",
      slug: "test-product-2",
      category: { _id: 2, name: "Test Category" },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/v1/product/product-category/test-category")) {
        return Promise.resolve({
          data: { products: mockProducts, category: { name: "Test Category" } },
        });
      }

      if (url.includes("/api/v1/product/test-product-1")) {
        return Promise.resolve({ data: { product: mockProducts[0] } });
      }

      return Promise.reject(new Error("Not found"));
    });
  });

  it("Should add products to the cart and display them correctly on the cart page", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/product/category/test-category"]}>
        <AuthProvider>
          <CartProvider>
            <Routes>
              <Route path='/product/category/:slug' element={<CategoryProduct />} />
              <Route path='/cart' element={<CartPage />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Test product 2")).toBeInTheDocument();
    });

    const addToCartButtons = screen.getAllByText("ADD TO CART");
    const firstAddToCartButton = addToCartButtons[1];

    await user.click(firstAddToCartButton);
    expect(toast.success).toHaveBeenCalledWith("Item Added to cart");

    const cartLink = screen.getByText("Cart", { selector: "a.nav-link" });
    await user.click(cartLink);

    await waitFor(() => {
      expect(screen.getByTestId("cart-items")).toBeInTheDocument();
    });

    expect(screen.getByText(/you have 1 items in your cart/i)).toBeInTheDocument();
    expect(screen.getByText("Total | Checkout | Payment")).toBeInTheDocument();
    expect(screen.getByText("Total : $200.00")).toBeInTheDocument();
    expect(screen.getByText("Test product 2")).toBeInTheDocument();
  });
});
