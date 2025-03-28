import React from "react";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import { render, waitFor, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useCart } from "../context/cart";
import { useAuth } from "../context/auth";
import CartPage from "./CartPage";

jest.mock("axios");

const mockNavigate = jest.fn();

jest.mock("../context/auth", () => ({
  useAuth: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../context/cart", () => ({
  useCart: jest.fn(() => [null, jest.fn(), jest.fn(), jest.fn(), jest.fn()]),
}));

jest.mock("../context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]),
}));

jest.mock("../context/category", () => ({
  useCategory: jest.fn(() => [[], jest.fn()]),
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: jest.fn(),
  useNavigate: () => mockNavigate,
}));

jest.mock("braintree-web-drop-in-react", () => {
  const React = require("react");
  return function DropIn(props) {
    React.useEffect(() => {
      props.onInstance({
        requestPaymentMethod: async () => ({ nonce: "test-nonce" }),
      });
    }, []);
    return <div data-testid="mock-dropin" />;
  };
});

Object.defineProperty(window, "localStorage", {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

window.matchMedia =
  window.matchMedia ||
  function () {
    return {
      matches: false,
      addListener: function () {},
      removeListener: function () {},
    };
  };

const renderCartPage = () => {
  return render(
    <MemoryRouter>
      <CartPage />
    </MemoryRouter>
  );
};

const mockItem = {
  _id: "1",
  name: "Test Product 1",
  description: "This is a test product",
  price: 100,
};

const mockItems = [
  mockItem,
  {
    _id: "2",
    name: "Test Product 2",
    description: "This description is 30 chars!!", // BVA: For descriptions of 30 characters or less, products should be rendered without "..."
    price: 69,
  },
];

const mockUser = {
  name: "Test User",
  address: "Test Address",
};

describe("Cart Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCart.mockReturnValue([[], jest.fn(), jest.fn(), jest.fn(), jest.fn()]);
    useAuth.mockReturnValue([[], jest.fn()]);
  });
  describe("UI Rendering", () => {
    describe("Cart Items", () => {
      it("should render a single cart item with details, total price, and remove button", () => {
        useCart.mockReturnValue([[mockItem], jest.fn(), jest.fn(), jest.fn(), jest.fn()]);
        renderCartPage();

        expect(screen.getByText(mockItem["name"])).toBeInTheDocument();
        expect(screen.getByText(mockItem["description"])).toBeInTheDocument();
        expect(
          screen.getByText((content) => content.includes("Total :"))
        ).toHaveTextContent(`$${mockItem["price"]}`);
        expect(screen.getAllByRole("button", { name: "Remove" }).length).toBe(
          1
        );
      });

      it("should render cart item with with long description correctly", () => {
        const expectedDescription = "This description is 31 chars!!...";
        const longMockItem = {
          _id: "1",
          name: "Test Product 1",
          description: "This description is 31 chars!!!",
          price: 1,
        };
        useCart.mockReturnValue([[longMockItem], jest.fn(), jest.fn(), jest.fn(), jest.fn()]);
        renderCartPage();

        expect(screen.getByText(expectedDescription)).toBeInTheDocument();
      });

      it("should render all cart items with their details, total price, and remove buttons", () => {
        useCart.mockReturnValue([mockItems, jest.fn(), jest.fn(), jest.fn(), jest.fn()]);
        renderCartPage();

        for (const mockItem of mockItems) {
          expect(screen.getByText(mockItem["name"])).toBeInTheDocument();
          expect(screen.getByText(mockItem["description"])).toBeInTheDocument();
        }
        const total_price = mockItems.reduce(
          (sum, item) => sum + item.price,
          0
        );
        expect(
          screen.getByText((content) => content.includes("Total :"))
        ).toHaveTextContent(`$${total_price}`);
        expect(screen.getAllByRole("button", { name: "Remove" }).length).toBe(
          mockItems.length
        );
      });

      it("should render an empty cart with a message, $0 total, and no remove buttons", () => {
        renderCartPage();

        expect(screen.getByText("Your Cart Is Empty")).toBeInTheDocument();
        expect(
          screen.getByText((content) => content.includes("Total :"))
        ).toHaveTextContent(`$${0}`);
        expect(
          screen.queryAllByRole("button", { name: "Remove" })
        ).toHaveLength(0);
      });
    });

    describe("User Information", () => {
      it("should render authenticated user info with name, address, and update address button", () => {
        useCart.mockReturnValue([mockItems, jest.fn(), jest.fn(), jest.fn(), jest.fn()]);
        useAuth.mockReturnValue([{ user: mockUser }, jest.fn()]);
        renderCartPage();

        expect(screen.getByText(mockUser["name"])).toBeInTheDocument();
        expect(screen.getByText(mockUser["address"])).toBeInTheDocument();
        expect(
          screen.queryAllByRole("button", { name: "Update Address" })
        ).toHaveLength(1);
      });

      it("should render a guest view with a login prompt and without address update options", () => {
        renderCartPage();

        expect(screen.getByText("Hello Guest")).toBeInTheDocument();
        expect(
          screen.queryAllByRole("button", { name: "Update Address" })
        ).toHaveLength(0);
        expect(
          screen.getByRole("button", { name: /please login to checkout/i })
        ).toBeInTheDocument();
      });
    });
  });

  describe("Cart Item Removal", () => {
    it("should remove a cart item when the remove button is clicked", () => {
      const setCart = jest.fn();
      useCart.mockReturnValue([mockItems, setCart, jest.fn(), jest.fn(), jest.fn()]);
      renderCartPage();

      const removeButtons = screen.getAllByRole("button", { name: "Remove" });
      fireEvent.click(removeButtons[0]);

      const updatedCart = [mockItems[1]];
      expect(setCart).toHaveBeenCalledWith(updatedCart);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "cart",
        JSON.stringify(updatedCart)
      );
    });
  });

  describe("Payment Processing", () => {
    it("should fetch the client token and renders the DropIn component", async () => {
      const clientToken = "Test Client Token";
      axios.get = jest
        .fn()
        .mockResolvedValue({ data: { clientToken: clientToken } });
      useAuth.mockReturnValue([{ token: "Test Auth Token" }, jest.fn()]);
      useCart.mockReturnValue([mockItems, jest.fn(), jest.fn(), jest.fn(), jest.fn()]);
      renderCartPage();

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          "/api/v1/product/braintree/token"
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId("mock-dropin")).toBeInTheDocument();
      });
    });

    it("should process payment successfully", async () => {
      const clientToken = "Test Client Token";
      axios.get = jest
        .fn()
        .mockResolvedValue({ data: { clientToken: clientToken } });
      axios.post.mockResolvedValue({ data: { success: true } });

      useAuth.mockReturnValue([
        { user: mockUser, token: "Test Auth Token" },
        jest.fn(),
      ]);
      useCart.mockReturnValue([mockItems, jest.fn(), jest.fn(), jest.fn(), jest.fn()]);
      renderCartPage();

      const paymentButton = await screen.findByText("Make Payment");
      fireEvent.click(paymentButton);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          "/api/v1/product/braintree/payment",
          {
            nonce: "test-nonce",
            cart: mockItems,
          }
        );
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard/user/orders");
      });
    });
  });

  describe("Navigation Flow", () => {
    it("should navigate to the profile page on 'Update Address' click for users with an address", async () => {
      useCart.mockReturnValue([mockItems, jest.fn(), jest.fn(), jest.fn(), jest.fn()]);
      useAuth.mockReturnValue([{ user: mockUser }, jest.fn()]);
      renderCartPage();

      expect(screen.getByText(mockUser["address"])).toBeInTheDocument();
      const updateButton = await screen.findByRole("button", {
        name: /update address/i,
      });
      fireEvent.click(updateButton);
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/user/profile");
    });

    it("should navigate to the profile page on 'Update Address' click for users without an address", async () => {
      const mockUserWithoutAddr = { name: "Test User" };
      useCart.mockReturnValue([mockItems, jest.fn(), jest.fn(), jest.fn()]);
      useAuth.mockReturnValue([
        { user: mockUserWithoutAddr, token: "test-token" },
        jest.fn(),
      ]);
      renderCartPage();

      const updateButton = await screen.findByRole("button", {
        name: /update address/i,
      });
      fireEvent.click(updateButton);
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard/user/profile");
      });
    });

    it("should navigate to the login page on 'Please Login' button click for unauthenticated users", async () => {
      renderCartPage();

      const loginButton = screen.getByRole("button", {
        name: /please login to checkout/i,
      });
      fireEvent.click(loginButton);
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/login", { state: "/cart" });
      });
    });
  });

  describe("Error Handling", () => {
    let error, consoleSpy;

    beforeEach(() => {
      error = new Error("Test error");
      consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    });
    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it("should not remove a cart item and logs an error when removal fails", async () => {
      localStorage.setItem.mockImplementation(() => {
        throw error;
      });

      const setCart = jest.fn();
      useCart.mockReturnValue([mockItems, setCart, jest.fn(), jest.fn(), jest.fn()]);
      renderCartPage();

      const removeButtons = screen.getAllByRole("button", { name: /remove/i });
      fireEvent.click(removeButtons[0]);

      await waitFor(() => {
        expect(setCart).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(error);
      });
    });

    it("should gracefully handle error in total price calculation", async () => {
      const toLocaleStringSpy = jest
        .spyOn(Number.prototype, "toLocaleString")
        .mockImplementation(() => {
          throw error;
        });

      renderCartPage();

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(error);
      });
      toLocaleStringSpy.mockRestore();
    });

    it("should gracefully handle error in getting payment token by logging the error payment processing by logging the error", async () => {
      axios.get.mockRejectedValueOnce(error);
      useAuth.mockReturnValue([{ token: "Test Auth Token" }, jest.fn()]);
      useCart.mockReturnValue([mockItems, jest.fn(), jest.fn(), jest.fn(), jest.fn()]);
      renderCartPage();

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          "/api/v1/product/braintree/token"
        );
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(error);
      });
    });

    it("should gracefully handle error in payment processing by logging the error and reset loading state", async () => {
      axios.get.mockResolvedValueOnce({
        data: { clientToken: "mockClientToken" },
      });
      axios.post.mockRejectedValueOnce(error);
      useAuth.mockReturnValue([
        { user: mockUser, token: "Test Auth Token" },
        jest.fn(),
      ]);
      useCart.mockReturnValue([[mockItem], jest.fn(), jest.fn(), jest.fn(), jest.fn()]);
      renderCartPage();

      const paymentButton = await screen.findByText("Make Payment");
      fireEvent.click(paymentButton);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          "/api/v1/product/braintree/payment",
          {
            nonce: "test-nonce",
            cart: expect.any(Array),
          }
        );
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(error);
      });
    });
  });
});
