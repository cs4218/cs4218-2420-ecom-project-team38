import React from "react";
import { render, screen } from "@testing-library/react";
import { CartProvider, useCart } from "./cart";
import "@testing-library/jest-dom";

const TestComponent = () => {
  const [cart] = useCart();
  return <div data-testid="cart-length">{cart.length}</div>;
};

const renderTestComponent = () => {
  return render(
    <CartProvider>
      <TestComponent />
    </CartProvider>
  );
};

const mockItems = [
  {
    _id: "1",
    name: "Test Product 1",
    description: "This is a test product",
    price: 100,
  },
  {
    _id: "2",
    name: "Test Product 2",
    description: "This is another test product",
    price: 69,
  },
];

describe("Cart Context", () => {
  beforeEach(() => {
    localStorage.clear();
  });
  it("should initialize with an empty cart when localStorage is empty", () => {
    renderTestComponent();
    expect(screen.getByTestId("cart-length")).toHaveTextContent(0);
  });

  it("should initialize with localStorage data", () => {
    localStorage.setItem("cart", JSON.stringify(mockItems));
    renderTestComponent();
    expect(screen.getByTestId("cart-length")).toHaveTextContent(mockItems.length);
  });
});
