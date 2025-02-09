import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { useSearch } from "../context/search";
import Search from "./Search";
import { MemoryRouter } from "react-router-dom";

jest.mock("axios");

jest.mock("../context/search", () => ({ useSearch: jest.fn() }));

jest.mock("../context/auth", () => ({
  useAuth: jest.fn(() => [{ user: null, token: "" }, jest.fn()]),
}));

jest.mock("../context/cart", () => ({
  useCart: jest.fn(() => [[], jest.fn()]),
}));

jest.mock("../hooks/useCategory", () =>
  jest.fn(() => [{ name: "test", slug: "test" }])
);

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
      { name: "Test product 1", description: "First test product!" },
      { name: "Test product 2", description: "Second test product!" },
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
  });
});
