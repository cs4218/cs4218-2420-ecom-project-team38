import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProductDetails from "./ProductDetails";
import { CartProvider } from "../context/cart";
import axios from "axios";
import { AuthProvider } from "../context/auth";
import toast from "react-hot-toast";
import CartPage from "./CartPage";

jest.mock("axios");
jest.mock("react-hot-toast");
jest.mock("../components/Form/SearchInput", () => () => <div>Mocked SearchInput</div>);

describe("Product Details integration test", () => {
  const mockProduct = {
    _id: 1,
    name: "Test product 1",
    price: 100,
    description: "This is a product description with more than 30 characters",
    slug: "test-product-1",
    category: { _id: 1, name: "Test Category" },
  };

  const mockRelatedProducts = [
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
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/v1/product/get-product/")) {
        return Promise.resolve({ data: { product: mockProduct } });
      } else if (url.includes("/api/v1/product/related-product/")) {
        return Promise.resolve({ data: { products: mockRelatedProducts } });
      }
      return Promise.reject(new Error("Not found"));
    });
  });

  it("Should add products to the cart and display them correctly on the cart page", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/product/test-product-1"]}>
        <AuthProvider>
          <CartProvider>
            <Routes>
              <Route path='/product/:slug' element={<ProductDetails />} />
              <Route path='/cart' element={<CartPage />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Name : Test product 1")).toBeInTheDocument();
    });

    const addToCartButtons = screen.getAllByText("ADD TO CART");
    const firstAddToCartButton = addToCartButtons[0];
    const secondAddToCartButton = addToCartButtons[1];

    await user.click(firstAddToCartButton);
    await user.click(secondAddToCartButton);

    expect(toast.success).toHaveBeenCalledWith("Item Added to cart");

    const cartLink = screen.getByText("Cart", { selector: "a.nav-link" });
    await user.click(cartLink);

    await waitFor(() => {
      expect(screen.getByTestId("cart-items")).toBeInTheDocument();
    });

    expect(screen.getByText(/you have 2 items in your cart/i)).toBeInTheDocument();
    expect(screen.getByText("Total | Checkout | Payment")).toBeInTheDocument();
    expect(screen.getByText("Total : $110.00")).toBeInTheDocument();
    expect(screen.getByText("Test product 1")).toBeInTheDocument();
    expect(screen.getByText("Test product 2")).toBeInTheDocument();
  });
});
