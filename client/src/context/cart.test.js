import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CartProvider, useCart } from "./cart";
import '@testing-library/jest-dom';

const mockItem = {
  _id: "1",
  name: "Test Product 1",
  description: "This is a test product",
  price: 100
}

const TestComponent = () => {
  const [cart, setCart] = useCart();
  return (
    <div>
      <div data-testid="cart-items">{JSON.stringify(cart)}</div>
      <button onClick={() => setCart([...cart, mockItem])}>Add Item</button>
    </div>
  );
};

Object.defineProperty(window, "localStorage", {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

const renderTestComponent = () => {
  return render(
    <CartProvider>
      <TestComponent />
    </CartProvider>
  );
};

describe("Cart Context", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with an empty cart when localStorage is empty", async () => {
    localStorage.getItem.mockReturnValueOnce(null);
    renderTestComponent();

    await waitFor(() => {
      expect(localStorage.getItem).toHaveBeenCalledWith("cart");
    });
    await waitFor(() => {
      expect(screen.getByTestId("cart-items").textContent).toBe("[]");
    });
  });

  it("should initialize with localStorage data", async () => {
    localStorage.getItem.mockReturnValueOnce(JSON.stringify(mockItem));
    renderTestComponent();

    await waitFor(() => {
      expect(localStorage.getItem).toHaveBeenCalledWith("cart");
    });
    await waitFor(() => {
      expect(screen.getByTestId("cart-items")).toHaveTextContent(JSON.stringify(mockItem));
    });
  });

  it("should update the cart when new item is added", async () => {
    localStorage.getItem.mockReturnValueOnce(null);
    renderTestComponent();

    fireEvent.click(screen.getByText("Add Item"));
    await waitFor(() => {
      expect(localStorage.getItem).toHaveBeenCalledWith("cart");
    });
    await waitFor(() => {
      expect(screen.getByTestId("cart-items")).toHaveTextContent(JSON.stringify([mockItem]));
    });
  });
});
