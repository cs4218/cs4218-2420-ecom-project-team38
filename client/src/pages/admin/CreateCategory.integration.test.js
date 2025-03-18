import React from "react";
import "@testing-library/jest-dom";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import CreateCategory from "./CreateCategory";
import axios from "axios";
import { CategoryProvider } from "../../context/category";
import Categories from "../Categories";

jest.mock("axios");

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../../context/cart", () => ({
  useCart: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../../context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]),
}));

describe("Create category page integration test", () => {
  const mockCategory1 = {
    _id: "test_catid_1",
    name: "Test Category 1",
    slug: "test-category-1",
  };
  const mockCategory2 = {
    _id: "test_catid_2",
    name: "Test Category 2",
    slug: "test-category-2",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("With categories header dropdown", () => {
    const renderCreateCategoryPage = () => {
      render(
        <CategoryProvider>
          <MemoryRouter>
            <CreateCategory />
          </MemoryRouter>
        </CategoryProvider>
      );
    };

    it("should display the new category in the categories header dropdown", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: { success: true, category: [mockCategory1] }, // initial call by CategoryProvider
        })
        .mockResolvedValueOnce({
          data: { success: true, category: [mockCategory1] }, // initial call by CreateCategory page
        })
        .mockResolvedValue({
          data: { success: true, category: [mockCategory1, mockCategory2] }, // calls after category creation
        });
      axios.post.mockResolvedValue({ data: { success: true } });

      renderCreateCategoryPage();

      fireEvent.change(screen.getByPlaceholderText("Enter new category"), {
        target: { value: mockCategory2.name },
      });
      fireEvent.click(screen.getByRole("button", { name: /submit/i }));
      fireEvent.click(screen.getByRole("link", { name: "Categories" }));

      expect(
        await screen.findByRole("link", { name: mockCategory2.name })
      ).toBeInTheDocument();
    });

    it("should display the updated category in the categories header dropdown", async () => {
      const mockUpdatedCategory1 = {
        _id: "test_catid_1",
        name: "Updated Category 1",
        slug: "updated-category-1",
      };
      axios.get
        .mockResolvedValueOnce({
          data: { success: true, category: [mockCategory1] }, // initial call by CategoryProvider
        })
        .mockResolvedValueOnce({
          data: { success: true, category: [mockCategory1] }, // initial call by CreateCategory page
        })
        .mockResolvedValue({
          data: { success: true, category: [mockUpdatedCategory1] }, // calls after category update
        });
      axios.put.mockResolvedValue({ data: { success: true } });

      renderCreateCategoryPage();

      fireEvent.click(await screen.findByRole("button", { name: /edit/i }));
      fireEvent.change(
        screen.getAllByPlaceholderText("Enter new category")[1],
        {
          target: { value: mockUpdatedCategory1.name },
        }
      );
      fireEvent.click(screen.getAllByRole("button", { name: /submit/i })[1]);
      fireEvent.click(screen.getByRole("link", { name: "Categories" }));

      expect(
        await screen.findByRole("link", { name: mockUpdatedCategory1.name })
      ).toBeInTheDocument();
    });

    it("should not display the deleted category in the categories header dropdown", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: { success: true, category: [mockCategory1] }, // initial call by CategoryProvider
        })
        .mockResolvedValueOnce({
          data: { success: true, category: [mockCategory1] }, // initial call by CreateCategory page
        })
        .mockResolvedValue({
          data: { success: true, category: [] }, // calls after category delete
        });
      axios.delete.mockResolvedValue({ data: { success: true } });

      renderCreateCategoryPage();

      fireEvent.click(await screen.findByRole("button", { name: /delete/i }));
      fireEvent.click(screen.getByRole("link", { name: "Categories" }));

      await waitFor(() =>
        expect(
          screen.queryByRole("link", { name: mockCategory1.name })
        ).not.toBeInTheDocument()
      );
    });
  });

  describe("With categories page", () => {
    const renderCreateCategoryPage = () => {
      render(
        <CategoryProvider>
          <MemoryRouter initialEntries={["/dashboard/admin/create-category"]}>
            <Routes>
              <Route
                path="/dashboard/admin/create-category"
                element={<CreateCategory />}
              />
              <Route path="/categories" element={<Categories />} />
            </Routes>
          </MemoryRouter>
        </CategoryProvider>
      );
    };

    it("should display the new category in the categories page", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: { success: true, category: [mockCategory1] }, // initial call by CategoryProvider
        })
        .mockResolvedValueOnce({
          data: { success: true, category: [mockCategory1] }, // initial call by CreateCategory page
        })
        .mockResolvedValue({
          data: { success: true, category: [mockCategory1, mockCategory2] }, // calls after category creation
        });
      axios.post.mockResolvedValue({ data: { success: true } });

      renderCreateCategoryPage();

      fireEvent.change(screen.getByPlaceholderText("Enter new category"), {
        target: { value: mockCategory2.name },
      });
      fireEvent.click(screen.getByRole("button", { name: /submit/i }));
      fireEvent.click(screen.getByRole("link", { name: "Categories" }));
      fireEvent.click(screen.getByRole("link", { name: "All Categories" }));

      const categoryLinks = await screen.findAllByTestId("category-link");
      const newCategoryLink = await within(categoryLinks[1]).findByRole(
        "link",
        { name: mockCategory2.name }
      );
      expect(newCategoryLink).toBeInTheDocument();
    });

    it("should display the updated category in the categories page", async () => {
      const mockUpdatedCategory1 = {
        _id: "test_catid_1",
        name: "Updated Category 1",
        slug: "updated-category-1",
      };
      axios.get
        .mockResolvedValueOnce({
          data: { success: true, category: [mockCategory1] }, // initial call by CategoryProvider
        })
        .mockResolvedValueOnce({
          data: { success: true, category: [mockCategory1] }, // initial call by CreateCategory page
        })
        .mockResolvedValue({
          data: { success: true, category: [mockUpdatedCategory1] }, // calls after category update
        });
      axios.put.mockResolvedValue({ data: { success: true } });

      renderCreateCategoryPage();

      fireEvent.click(await screen.findByRole("button", { name: /edit/i }));
      fireEvent.change(
        screen.getAllByPlaceholderText("Enter new category")[1],
        {
          target: { value: mockUpdatedCategory1.name },
        }
      );
      fireEvent.click(screen.getAllByRole("button", { name: /submit/i })[1]);
      fireEvent.click(screen.getByRole("link", { name: "Categories" }));
      fireEvent.click(screen.getByRole("link", { name: "All Categories" }));

      const categoryLinks = await screen.findAllByTestId("category-link");
      const updatedCategoryLink = await within(categoryLinks[0]).findByRole(
        "link",
        { name: mockUpdatedCategory1.name }
      );
      expect(updatedCategoryLink).toBeInTheDocument();
    });

    it("should not display the deleted category in the categories page", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: { success: true, category: [mockCategory1] }, // initial call by CategoryProvider
        })
        .mockResolvedValueOnce({
          data: { success: true, category: [mockCategory1] }, // initial call by CreateCategory page
        })
        .mockResolvedValue({
          data: { success: true, category: [] }, // calls after category delete
        });
      axios.delete.mockResolvedValue({ data: { success: true } });

      renderCreateCategoryPage();

      fireEvent.click(await screen.findByRole("button", { name: /delete/i }));
      fireEvent.click(screen.getByRole("link", { name: "Categories" }));
      fireEvent.click(screen.getByRole("link", { name: "All Categories" }));

      await waitFor(() =>
        expect(screen.queryByTestId("category-link")).not.toBeInTheDocument()
      );
    });
  });
});
