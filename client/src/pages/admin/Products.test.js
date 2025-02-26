import React from "react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor, within } from "@testing-library/react";
import Products from "./Products";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

jest.mock("axios");

jest.mock("react-hot-toast");

jest.spyOn(console, "log").mockImplementation(() => {});

jest.mock("../../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

const TestComponent = () => {
  const location = useLocation();
  return <div>{location.pathname}</div>;
};

describe("Products page", () => {
  let mockProducts;

  beforeEach(() => {
    jest.clearAllMocks();
    mockProducts = [
      {
        _id: "1",
        name: "product1",
        slug: "product1",
        description: "description1",
      },
      {
        _id: "2",
        name: "product2",
        slug: "product2",
        description: "description2",
      },
    ];
    axios.get.mockResolvedValue({ data: { products: mockProducts } });
  });

  it("Should render all products", async () => {
    render(
      <MemoryRouter>
        <Products />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product")
    );
    const productsList = screen.getByTestId("products-list");
    expect(productsList.children.length).toBe(2);

    for (let i = 0; i < mockProducts.length; i++) {
      const product = mockProducts[i];
      const productLink = productsList.children[i];
      expect(productLink).toHaveAttribute(
        "href",
        `/dashboard/admin/product/${product.slug}`
      );
      const productCard = productLink.children[0];
      const productImage = within(productCard).getByRole("img");
      const productTitle = within(productCard).getByText(product.name);
      const productDescription = within(productCard).getByText(
        product.description
      );
      expect(productImage).toHaveAttribute(
        "src",
        `/api/v1/product/product-photo/${product._id}`
      );
      expect(productTitle).toBeInTheDocument();
      expect(productDescription).toBeInTheDocument();
    }
  });

  it("No products rendered when API returns empty array", async () => {
    axios.get.mockResolvedValue({ data: { products: [] } });

    render(
      <MemoryRouter>
        <Products />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product")
    );
    const productsList = screen.getByTestId("products-list");
    expect(productsList.children.length).toBe(0);
  });

  it("Should redirect user to product update page when product card is clicked", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/dashboard/admin/products"]}>
        <Routes>
          <Route path="/dashboard/admin/products" element={<Products />} />
          <Route
            path="/dashboard/admin/product/:slug"
            element={<TestComponent />}
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product")
    );

    const productsList = screen.getByTestId("products-list");
    const product1Link = productsList.children[0];
    await user.click(product1Link);
    expect(product1Link).toHaveAttribute(
      "href",
      "/dashboard/admin/product/product1"
    );
    expect(
      screen.getByText(`/dashboard/admin/product/product1`)
    ).toBeInTheDocument();
  });

  it("Should show error message when API call to fetch products fails", async () => {
    const mockError = new Error("Error fetching products");
    axios.get.mockRejectedValueOnce(mockError);

    render(
      <MemoryRouter>
        <Products />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product")
    );
    expect(toast.error).toHaveBeenCalledWith("Something Went Wrong");
    expect(console.log).toHaveBeenCalledWith(mockError);
  });
});
