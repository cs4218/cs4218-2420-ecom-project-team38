import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import CategoryProduct from "./CategoryProduct";
import { useParams, useNavigate } from "react-router-dom";
import "@testing-library/jest-dom";

jest.mock("axios");

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

describe("CategoryProduct Component", () => {
  beforeEach(() => {
    useParams.mockReturnValue({ slug: "test-category" });
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.clearAllMocks();
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  it("Should correctly display products belonging to the category", async () => {
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
              },
              {
                _id: "12346",
                name: "Test Product 2",
                description: "This is another test product",
                price: 20.0,
                category: { _id: "10", name: "Test Category" },
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
      const firstTruncatedDescription = "This is a test product".substring(0, 60) + "...";
      expect(screen.getByText(firstTruncatedDescription)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Test Product 2")).toBeInTheDocument();
    });

    await waitFor(() => {
      const moreDetailsButtons = screen.getAllByRole("button", { name: /more details/i });
      expect(moreDetailsButtons.length).toBe(2);
    });
  });
});
