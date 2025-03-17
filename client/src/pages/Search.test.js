import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { useSearch } from "../context/search";
import Search from "./Search";
import { MemoryRouter } from "react-router-dom";
import toast from "react-hot-toast";

jest.mock("axios");

const mockUseNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockUseNavigate,
}));

jest.mock("../context/search", () => ({ useSearch: jest.fn() }));

jest.mock("../context/auth", () => ({
  useAuth: jest.fn(() => [{ user: null, token: "" }, jest.fn()]),
}));

const mockSetCart = jest.fn();

jest.mock("../context/cart", () => ({
  useCart: jest.fn(() => [[], mockSetCart]),
}));

jest.mock("../context/category", () => ({
  useCategory: jest.fn(() => [[{ name: "test", slug: "test" }], jest.fn()]),
}));

jest.mock("react-hot-toast");

window.matchMedia =
  window.matchMedia ||
  function () {
    return {
      matches: false,
      addListener: function () {},
      removeListener: function () {},
    };
  };

jest.mock("../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

describe("Search page", () => {
  describe("No products found", () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it("Displays a message when no products are found", () => {
      useSearch.mockReturnValue([{ results: [] }, jest.fn()]);
      render(
        <MemoryRouter initialEntries={["/search"]}>
          <Search />
        </MemoryRouter>
      );
      expect(screen.getByText("No Products Found")).toBeInTheDocument();
    });

    it("No products are displayed", () => {
      useSearch.mockReturnValue([{ results: [] }, jest.fn()]);
      render(
        <MemoryRouter>
          <Search />
        </MemoryRouter>
      );

      const productCards = screen.queryAllByTestId("product-card");
      expect(productCards).toHaveLength(0);
    });
  });

  describe("Products found", () => {
    let mockProducts = [
      {
        _id: 1,
        name: "Test product 1",
        price: 100,
        description:
          "This is a product description with more than 30 characters",
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

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("Displays the number of products found", () => {
      useSearch.mockReturnValue([{ results: mockProducts }, jest.fn()]);

      render(
        <MemoryRouter>
          <Search />
        </MemoryRouter>
      );

      expect(screen.getByText("Found 2")).toBeInTheDocument();
    });

    it("Displays the products", () => {
      useSearch.mockReturnValue([{ results: mockProducts }, jest.fn()]);

      render(
        <MemoryRouter>
          <Search />
        </MemoryRouter>
      );

      const productCards = screen.queryAllByTestId("product-card");
      expect(productCards).toHaveLength(2);
    });

    describe("Product details", () => {
      it("Displays the product image alt text if image is not found", () => {
        useSearch.mockReturnValue([{ results: [mockProducts[0]] }, jest.fn()]);

        render(
          <MemoryRouter>
            <Search />
          </MemoryRouter>
        );

        const imageElement = screen.getByAltText(mockProducts[0].name);
        fireEvent.error(imageElement);

        expect(screen.getByAltText(mockProducts[0].name)).toBeInTheDocument();
      });

      it("Displays the product name", () => {
        useSearch.mockReturnValue([{ results: [mockProducts[0]] }, jest.fn()]);

        render(
          <MemoryRouter>
            <Search />
          </MemoryRouter>
        );

        expect(screen.getByText(mockProducts[0].name)).toBeInTheDocument();
      });
    });

    it("Does not truncate product description with less than 30 characters", () => {
      useSearch.mockReturnValue([{ results: [mockProducts[1]] }, jest.fn()]);

      render(
        <MemoryRouter>
          <Search />
        </MemoryRouter>
      );

      expect(screen.getByText(mockProducts[1].description)).toBeInTheDocument();
    });

    it("Truncates product description with more than 30 characters", () => {
      useSearch.mockReturnValue([{ results: [mockProducts[0]] }, jest.fn()]);

      render(
        <MemoryRouter>
          <Search />
        </MemoryRouter>
      );

      expect(
        screen.getByText(`${mockProducts[0].description.substring(0, 30)}...`)
      ).toBeInTheDocument();
    });

    it("Displays the product price", () => {
      useSearch.mockReturnValue([{ results: [mockProducts[0]] }, jest.fn()]);

      render(
        <MemoryRouter>
          <Search />
        </MemoryRouter>
      );

      expect(
        screen.getByText(`$ ${mockProducts[0].price}`)
      ).toBeInTheDocument();
    });

    describe("Clicking buttons", () => {
      it("Redirect to product details page when 'More Details' button is clicked", async () => {
        const user = userEvent.setup();
        useSearch.mockReturnValue([{ results: [mockProducts[0]] }, jest.fn()]);

        render(
          <MemoryRouter>
            <Search />
          </MemoryRouter>
        );

        await user.click(screen.getByText("More Details"));
        expect(mockUseNavigate).toHaveBeenCalledWith(
          `/product/${mockProducts[0].slug}`
        );
      });

      it("Add product to cart when 'Add to Cart' button is clicked", async () => {
        useSearch.mockReturnValue([{ results: [mockProducts[0]] }, jest.fn()]);
        // reference: https://marek-rozmus.medium.com/mocking-local-storage-with-jest-c4b35a45d62e
        const mockSetItem = jest.spyOn(Storage.prototype, "setItem");
        mockSetItem.mockImplementation(() => {});
        const user = userEvent.setup();

        render(
          <MemoryRouter>
            <Search />
          </MemoryRouter>
        );

        const addToCartButton = screen.getByText("ADD TO CART");
        await user.click(addToCartButton);

        expect(mockSetCart).toHaveBeenCalledWith([mockProducts[0]]);
        expect(mockSetItem).toHaveBeenCalledWith(
          "cart",
          JSON.stringify([mockProducts[0]])
        );
        expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
      });
    });
  });
});
