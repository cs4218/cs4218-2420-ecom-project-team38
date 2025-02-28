import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import ProductDetails from "../pages/ProductDetails";
import { useParams, useNavigate } from "react-router-dom";
import { useCart } from "../context/cart";
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

jest.mock("../components/Form/SearchInput", () => () => <div>Mocked SearchInput</div>);

Object.defineProperty(window, "localStorage", {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

describe("ProductDetails Component", () => {
  beforeEach(() => {
    useParams.mockReturnValue({ slug: "test-product" });
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.clearAllMocks();
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  it("Correctly renders product details", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("get-product/test-product")) {
        return Promise.resolve({
          data: {
            product: {
              _id: "12345",
              name: "Test Product 1",
              description: "This is a test product",
              price: 10.0,
              category: { _id: "10", name: "Electronics" },
            },
          },
        });
      }

      return Promise.reject(new Error("Not Found"));
    });

    render(
      <MemoryRouter>
        <ProductDetails />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Product Details")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Name : Test Product 1")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Description : This is a test product")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Category : Electronics")).toBeInTheDocument();
    });

    await waitFor(() => {
      const priceContainer = screen.getByText((content, element) => {
        return (
          element.tagName.toLowerCase() === "h6" &&
          content.startsWith("Price :") &&
          content.includes("$10.00")
        );
      });
      expect(priceContainer).toBeInTheDocument();
    });
  });

  it("Should redirect to the 404 page if an invalid slug is accessed", async () => {
    useParams.mockReturnValue({ slug: "invalid-slug" });

    axios.get.mockImplementation((url) => {
      if (url.includes("get-product/invalid-slug")) {
        return Promise.resolve({
          data: {
            product: null,
          },
        });
      }

      return Promise.reject(new Error("Not Found"));
    });

    const navigate = jest.fn();
    useNavigate.mockReturnValue(navigate);

    render(
      <MemoryRouter initialEntries={["/product/invalid-slug"]}>
        <ProductDetails />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        `/api/v1/product/get-product/invalid-slug`
      );
    });

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/404");
    });
  });

  it('Should handle errors gracefully when fetching product details of a existing product', async () => {
    const errorMsg = 'Error fetching product details';
    axios.get.mockRejectedValue(new Error(errorMsg));

    render(
      <MemoryRouter initialEntries={["/product/test-product"]}>
        <ProductDetails />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(`/api/v1/product/get-product/test-product`);

      expect(console.error).toHaveBeenCalledWith(new Error(errorMsg));
    });
  });

  it("Should not call getProduct hook when slug is missing", () => {
    useParams.mockReturnValue({});

    render(
      <MemoryRouter>
        <ProductDetails />
      </MemoryRouter>
    );

    expect(axios.get).not.toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/product/get-product/")
    );
  });

  it("Navigates to the product details page when the 'More Details' button is clicked", async () => {
    const navigate = jest.fn();
    useNavigate.mockReturnValue(navigate);

    axios.get.mockImplementation((url) => {
      if (url.includes("get-product/test-product")) {
        return Promise.resolve({
          data: {
            product: {
              _id: "10000",
              name: "Test Product 2",
              description: "This is a test product",
              price: 10.0,
              category: { _id: "10", name: "Electronics" },
            },
          },
        });
      }

      if (url.includes("get-product/similar-product")) {
        return Promise.resolve({
          data: {
            product: {
              _id: "2134",
              name: "Similar Product",
              description: "Similar product to Test Product",
              price: 20.0,
              category: { _id: "10", name: "Electronics" },
            },
          },
        });
      }

      if (url.includes("related-product/10000/10")) {
        return Promise.resolve({
          data: {
            products: [
              {
                _id: "2134",
                name: "Similar Product",
                description: "Similar product to Test Product",
                price: 20.0,
                slug: "similar-product",
              },
              {
                _id: "3",
                name: "Similar Product 2",
                description: "Another similar product to Test Product",
                price: 25.0,
                slug: "similar-product-2",
              },
            ],
          },
        });
      }

      return Promise.reject(new Error("Not Found"));
    });

    const { rerender } = render(
      <MemoryRouter initialEntries={["/product/test-product"]}>
        <ProductDetails />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Product Details")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Name : Test Product 2")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Similar Products ➡️")).toBeInTheDocument();
    });

    const similarProductName = await screen.findByText("Similar Product");
    expect(similarProductName).toBeInTheDocument();

    const similarProductDesc = await screen.findByText("Similar product to Test Product...");
    expect(similarProductDesc).toBeInTheDocument();

    const moreDetailsButtons = screen.getAllByText("More Details");
    fireEvent.click(moreDetailsButtons[0]);

    expect(navigate).toHaveBeenCalledWith("/product/similar-product");

    // re-render the ProductDetails component with the new slug
    useParams.mockReturnValue({ slug: "similar-product" });
    rerender(
      <MemoryRouter initialEntries={["/product/similar-product"]}>
        <ProductDetails />
      </MemoryRouter>
    );

    // wait for the new product details to render
    await waitFor(() => {
      expect(screen.getByText("Product Details")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Name : Similar Product")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Description : Similar product to Test Product")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Category : Electronics")).toBeInTheDocument();
    });

    await waitFor(() => {
      const priceContainer = screen.getByText((content, element) => {
        return (
          element.tagName.toLowerCase() === "h6" &&
          content.startsWith("Price :") &&
          content.includes("$20.00")
        );
      });
      expect(priceContainer).toBeInTheDocument();
    });
  });

  it("Displays no similar products message when no similar products exist", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("get-product/test-product")) {
        return Promise.resolve({
          data: {
            product: {
              _id: "5000",
              name: "Test Product",
              description: "This is a test product",
              price: 10.0,
              category: { _id: "100", name: "Electronics" },
            },
          },
        });
      }

      if (url.includes("related-product/5000/100")) {
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
        <ProductDetails />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("No Similar Products found")).toBeInTheDocument();
    });
  });

  it("Adds product to cart when 'ADD TO CART' button is clicked", async () => {
    const mockSetCart = jest.fn();
    useCart.mockReturnValue([[], mockSetCart]);

    axios.get.mockImplementation((url) => {
      if (url.includes("get-product/test-product")) {
        return Promise.resolve({
          data: {
            product: {
              _id: "12345",
              name: "Test Product 1",
              description: "This is a test product",
              price: 10.0,
              category: { _id: "10", name: "Electronics" },
            },
          },
        });
      }

      return Promise.reject(new Error("Not Found"));
    });

    render(
      <MemoryRouter>
        <ProductDetails />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Product Details")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Name : Test Product 1")).toBeInTheDocument();
    });

    const addToCartButton = screen.getByText("ADD TO CART");
    fireEvent.click(addToCartButton);

    expect(mockSetCart).toHaveBeenCalledWith([
      {
        _id: "12345",
        name: "Test Product 1",
        description: "This is a test product",
        price: 10.0,
        category: { _id: "10", name: "Electronics" },
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
          category: { _id: "10", name: "Electronics" },
        },
      ])
    );

    expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
  });

  it("Adds similar product to cart when 'ADD TO CART' button is clicked for related product", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("get-product/test-product")) {
        return Promise.resolve({
          data: {
            product: {
              _id: "10000",
              name: "Test Product 2",
              description: "This is a test product",
              price: 10.0,
              category: { _id: "10", name: "Electronics" },
            },
          },
        });
      }

      if (url.includes("get-product/similar-product")) {
        return Promise.resolve({
          data: {
            product: {
              _id: "2134",
              name: "Similar Product",
              description: "Similar product to Test Product",
              price: 20.0,
              category: { _id: "10", name: "Electronics" },
            },
          },
        });
      }

      if (url.includes("related-product/10000/10")) {
        return Promise.resolve({
          data: {
            products: [
              {
                _id: "2134",
                name: "Similar Product",
                description: "Similar product to Test Product",
                price: 20.0,
                slug: "similar-product",
              },
              {
                _id: "3",
                name: "Similar Product 2",
                description: "Another similar product to Test Product",
                price: 25.0,
                slug: "similar-product-2",
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
      <MemoryRouter initialEntries={["/product/test-product"]}>
        <ProductDetails />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Product Details")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Name : Test Product 2")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Similar Products ➡️")).toBeInTheDocument();
    });

    const moreAddToCartButtons = screen.getAllByText("ADD TO CART");
    fireEvent.click(moreAddToCartButtons[1]);

    expect(mockSetCart).toHaveBeenCalledWith([
      {
        _id: "2134",
        name: "Similar Product",
        description: "Similar product to Test Product",
        price: 20.0,
        slug: "similar-product",
      },
    ]);

    expect(localStorage.setItem).toHaveBeenCalledWith(
      "cart",
      JSON.stringify([
        {
          _id: "2134",
          name: "Similar Product",
          description: "Similar product to Test Product",
          price: 20.0,
          slug: "similar-product",
        },
      ])
    );

    expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
  });
});
