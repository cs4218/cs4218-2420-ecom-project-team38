import React from "react";
import axios, { AxiosError } from "axios";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";

import {
  render,
  waitFor,
  screen,
  fireEvent,
  within,
} from "@testing-library/react";

import toast from "react-hot-toast";
import { useCart } from "../context/cart";

import HomePage from "./HomePage";

jest.mock("axios");
jest.mock("react-hot-toast");

const mockNavigate = jest.fn();

jest.mock("../context/auth", () => ({
  useAuth: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../context/cart", () => ({
  useCart: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]),
}));

jest.mock("../hooks/useCategory", () => jest.fn(() => []));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: jest.fn(),
  useNavigate: () => mockNavigate,
}));

Object.defineProperty(window, "localStorage", {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

Object.defineProperty(window, "location", {
  writable: true,
  value: {
    reload: jest.fn(),
  },
});

const renderHomePage = () => {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>
  );
};

const mockCategories = [
  {
    _id: "1",
    name: "Test Category 1",
    slug: "Test-Category-1",
  },
  {
    _id: "2",
    name: "Test Category 2",
    slug: "Test-Category-2",
  },
];

const mockProducts = [
  {
    _id: "1",
    name: "Test Product 1",
    slug: "Test-Product-1",
    description: "Test Description 1",
    price: 1.99,
  },
  {
    _id: "2",
    name: "Test Product 2",
    slug: "Test-Product-2",
    description: "Test Description 2",
    price: 2.99,
  },
];

const mockProductsPageTwo = [
  {
    _id: "3",
    name: "Test Product 3",
    slug: "Test-Product-3",
    description: "Test Description 3",
    price: 3.99,
  },
  {
    _id: "4",
    name: "Test Product 4",
    slug: "Test-Product-4",
    description: "Test Description 4",
    price: 4.99,
  },
];

const mockPriceOption = "$0 to $19.99";

const CATEGORY_URL = "/api/v1/category/get-category";
const PRODUCT_URL = "/api/v1/product/product-list/1";
const PRODUCT_URL_PAGE_2 = "/api/v1/product/product-list/2";
const COUNT_URL = "/api/v1/product/product-count";
const FILTER_URL = "/api/v1/product/product-filters";

describe("Home Page", () => {
  let consoleSpy;
  const axiosError = new AxiosError("Axios error");

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    jest.clearAllMocks();
  });

  describe("Categories Component", () => {
    it("should render all the categories in the home page", async () => {
      axios.get.mockResolvedValue({
        data: { success: true, category: mockCategories },
      });
      renderHomePage();

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(CATEGORY_URL);
        const categoryList = screen.getByTestId("category-list");

        mockCategories.forEach((category) => {
          expect(
            within(categoryList).getByText(category.name)
          ).toBeInTheDocument();
        });
      });
    });

    it("should not render any category if axios return failure", async () => {
      axios.get.mockResolvedValue({
        data: { success: false, category: [] },
      });
      renderHomePage();

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(CATEGORY_URL);
      });

      expect(
        screen.queryByText(mockCategories[0].name)
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(mockCategories[1].name)
      ).not.toBeInTheDocument();
    });
  });

  describe("Products Component", () => {
    beforeEach(() => {
      axios.get.mockResolvedValue({
        data: { success: true, products: mockProducts },
      });
    });

    const validateProductsRendered = async () => {
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(PRODUCT_URL);
        const productList = screen.getByTestId("product-list");
        mockProducts.forEach((product) => {
          expect(
            within(productList).getByText(product.name)
          ).toBeInTheDocument();
        });
      });
    };

    it("should render all the products in the home page", async () => {
      renderHomePage();
      await validateProductsRendered();
    });

    it("should render products with long description correctly", async () => {
      const expectedDescription =
        "This is a very very very very long description Test Descript...";
      const mockProduct = {
        _id: "1",
        name: "Test Product 1",
        slug: "Test-Product-1",
        description:
          "This is a very very very very long description Test Description 3",
        price: 1.99,
      };
      axios.get.mockResolvedValue({
        data: { success: true, products: [mockProduct] },
      });
      renderHomePage();
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(PRODUCT_URL);
      });
      const productList = screen.getByTestId("product-list");
      expect(
        within(productList).getByText(expectedDescription)
      ).toBeInTheDocument();
    });

    it("should navigate to the product details page when it is clicked", async () => {
      renderHomePage();
      await validateProductsRendered();

      const detailsButton = screen.getAllByRole("button", {
        name: /more details/i,
      });
      fireEvent.click(detailsButton[0]);

      expect(mockNavigate).toHaveBeenCalledWith(
        `/product/${mockProducts[0].slug}`
      );
    });

    it("should update the cart and display a success message", async () => {
      const setCartMock = jest.fn();
      useCart.mockReturnValue([[], setCartMock]);
      renderHomePage();
      await validateProductsRendered();

      const addToCartButton = screen.getAllByRole("button", {
        name: /add to cart/i,
      });
      fireEvent.click(addToCartButton[0]);

      expect(setCartMock).toHaveBeenCalledWith(
        expect.arrayContaining([mockProducts[0]])
      );
      expect(toast.success).toHaveBeenCalledWith("Item added to cart");
    });
  });

  describe("Total Count Component", () => {
    const mockGetImplementation = (count) => {
      axios.get.mockImplementation((url) => {
        if (url === COUNT_URL) {
          return Promise.resolve({ data: { total: count } });
        } else if (url === PRODUCT_URL) {
          return Promise.resolve({ data: { products: mockProducts } });
        } else if (url === PRODUCT_URL_PAGE_2) {
          return Promise.resolve({ data: { products: mockProductsPageTwo } });
        }
      });
    };

    it("should render Load more when the total count is more than the product count in the first page", async () => {
      mockGetImplementation(mockProducts.length + 1);
      renderHomePage();

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(COUNT_URL);
      });

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(PRODUCT_URL);
      });

      await waitFor(() => {
        expect(screen.getByText("Load more")).toBeInTheDocument();
      });
    });

    it("should not render Load more when the total count is less than the product count in the first page", async () => {
      mockGetImplementation(mockProducts.length - 1);
      renderHomePage();

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(COUNT_URL);
      });

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(PRODUCT_URL);
      });

      await waitFor(() => {
        expect(screen.queryByText("Load more")).not.toBeInTheDocument();
      });
    });

    it("should render next page of products when Load more is clicked", async () => {
      mockGetImplementation(mockProducts.length + mockProductsPageTwo.length);
      renderHomePage();
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(PRODUCT_URL);
      });
      const loadMoreButton = screen.getByText("Load more");
      fireEvent.click(loadMoreButton);
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(PRODUCT_URL_PAGE_2);
      });

      await waitFor(() => {
        const productList = screen.getByTestId("product-list");
        mockProducts.forEach((product) => {
          expect(
            within(productList).getByText(product.name)
          ).toBeInTheDocument();
        });

        mockProductsPageTwo.forEach((product) => {
          expect(
            within(productList).getByText(product.name)
          ).toBeInTheDocument();
        });
      });
    });
  });

  describe("Filter Component", () => {
    // Fetch categories and render Homepage
    beforeEach(async () => {
      axios.get.mockImplementation((url) => {
        if (url === CATEGORY_URL) {
          return Promise.resolve({
            data: { success: true, category: mockCategories },
          });
        }
      });
    });

    it("should render the filtered products based on category in the home page", async () => {
      axios.post.mockResolvedValue({
        data: { products: [mockProducts[0]] },
      });

      renderHomePage();

      const categoryCheckbox = await screen.findByText(mockCategories[0].name);
      fireEvent.click(categoryCheckbox);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(FILTER_URL, {
          checked: [mockCategories[0]._id],
          radio: [],
        });
      });

      const productList = screen.getByTestId("product-list");
      expect(
        within(productList).getByText(mockProducts[0].name)
      ).toBeInTheDocument();
      expect(screen.queryByText(mockProducts[1].name)).not.toBeInTheDocument();
    });

    it("should render the filtered products based on price in the home page", async () => {
      axios.post.mockResolvedValue({
        data: { products: [mockProducts[0]] },
      });

      renderHomePage();

      const priceCheckbox = await screen.findByText(mockPriceOption);
      fireEvent.click(priceCheckbox);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(FILTER_URL, {
          checked: [],
          radio: [0, 19.99],
        });
      });

      const productList = screen.getByTestId("product-list");
      expect(
        within(productList).getByText(mockProducts[0].name)
      ).toBeInTheDocument();
      expect(screen.queryByText(mockProducts[1].name)).not.toBeInTheDocument();
    });

    it("should uncheck the check box if clicked twice", async () => {
      axios.post.mockResolvedValue({
        data: { products: [mockProducts[0]] },
      });
      renderHomePage();

      const categoryCheckbox = await screen.findByText(mockCategories[0].name);
      fireEvent.click(categoryCheckbox);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(FILTER_URL, {
          checked: [mockCategories[0]._id],
          radio: [],
        });
      });

      const categoryCheckbox2 = screen.getByLabelText(mockCategories[1].name);
      fireEvent.click(categoryCheckbox2);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(FILTER_URL, {
          checked: [mockCategories[0]._id, mockCategories[1]._id],
          radio: [],
        });
      });

      fireEvent.click(categoryCheckbox);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(FILTER_URL, {
          checked: [mockCategories[1]._id],
          radio: [],
        });
      });
    });

    it("should uncheck all checked box and radio when reset filter is clicked", async () => {
      axios.post.mockResolvedValue({
        data: { products: [mockProducts[0]] },
      });
      renderHomePage();

      const categoryCheckbox = await screen.findByText(mockCategories[0].name);
      fireEvent.click(categoryCheckbox);

      const priceCheckbox = screen.getByLabelText(mockPriceOption);
      fireEvent.click(priceCheckbox);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(FILTER_URL, {
          checked: [mockCategories[0]._id],
          radio: [0, 19.99],
        });
      });

      const resetButton = screen.getByText("RESET FILTERS");
      fireEvent.click(resetButton);
      expect(window.location.reload).toHaveBeenCalled();
    });

    it("should gracefully handle error in retrieving filtered products", async () => {
      axios.post.mockRejectedValue(axiosError);
      renderHomePage();

      const categoryCheckbox = await screen.findByText(mockCategories[0].name);
      fireEvent.click(categoryCheckbox);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(FILTER_URL, {
          checked: [mockCategories[0]._id],
          radio: [],
        });
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(axiosError);
      });
      consoleSpy.mockRestore();
    });
  });

  describe("Axios Errors", () => {
    const mockError = (axiosUrl) => {
      axios.get.mockImplementation((url) => {
        if (url === axiosUrl) {
          return Promise.reject(axiosError);
        }
      });
    };

    const validateError = async (axiosUrl) => {
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(axiosUrl);
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(axiosError);
      });
    };

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it("should gracefully handle error in retrieving categories", async () => {
      mockError(CATEGORY_URL);
      renderHomePage();
      validateError(CATEGORY_URL);
    });

    it("should gracefully handle error in retrieving products", async () => {
      mockError(PRODUCT_URL);
      renderHomePage();
      validateError(PRODUCT_URL);
    });

    it("should gracefully handle error in retrieving total count", async () => {
      mockError(COUNT_URL);
      renderHomePage();
      validateError(COUNT_URL);
    });

    it("should gracefully handle error in retrieving more products when load more is clicked", async () => {
      axios.get.mockImplementation((url) => {
        if (url === COUNT_URL) {
          return Promise.resolve({ data: { total: 4 } });
        } else if (url === PRODUCT_URL) {
          return Promise.resolve({ data: { products: mockProducts } });
        }
      });

      renderHomePage();
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(PRODUCT_URL);
      });
      mockError(PRODUCT_URL_PAGE_2);

      const loadMoreButton = screen.getByText("Load more");
      fireEvent.click(loadMoreButton);
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(PRODUCT_URL_PAGE_2);
      });
      validateError(PRODUCT_URL_PAGE_2);
    });
  });
});
