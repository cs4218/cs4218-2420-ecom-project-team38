import { renderHook, waitFor } from "@testing-library/react";
import axios from "axios";
import toast from "react-hot-toast";
import "@testing-library/jest-dom";
import { CategoryProvider, useCategory } from "./category";

jest.mock("axios");

jest.mock("react-hot-toast");

jest.spyOn(console, "log").mockImplementation(() => {});

describe("Category Context", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make API call to get all categories", async () => {
    axios.get.mockResolvedValue({ data: {} });

    renderHook(() => useCategory(), { wrapper: CategoryProvider });

    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category")
    );
  });

  it("should return the category list in the API response", async () => {
    const mockCategoryData = {
      success: true,
      message: "All Categories List",
      category: [
        {
          _id: "test_catid_1",
          name: "Test Category 1",
          slug: "test-category-1",
        },
        {
          _id: "test_catid_2",
          name: "Test Category 2",
          slug: "test-category-2",
        },
      ],
    };

    axios.get.mockResolvedValue({ data: mockCategoryData });

    const { result } = renderHook(() => useCategory(), {
      wrapper: CategoryProvider,
    });

    await waitFor(() =>
      expect(result.current[0]).toBe(mockCategoryData.category)
    );
  });

  it("should return an empty list when API call to get all categories fails", async () => {
    axios.get.mockRejectedValue(new Error("Backend error"));

    const { result } = renderHook(() => useCategory(), {
      wrapper: CategoryProvider,
    });

    await waitFor(() => expect(result.current[0]).toEqual([]));
  });

  it("should display error message when API call to get all categories fails", async () => {
    axios.get.mockRejectedValue(new Error("Backend error"));

    renderHook(() => useCategory(), { wrapper: CategoryProvider });

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Something went wrong in getting categories"
      )
    );
  });
});
