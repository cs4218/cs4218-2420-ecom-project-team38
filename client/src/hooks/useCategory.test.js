import { renderHook, waitFor } from "@testing-library/react";
import axios from "axios";
import toast from "react-hot-toast";
import "@testing-library/jest-dom";
import useCategory from "./useCategory";

jest.mock("axios");

jest.mock("react-hot-toast");

jest.spyOn(console, "log").mockImplementation(() => {});

describe("Use Category Hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make API call to get all categories", async () => {
    axios.get.mockResolvedValue({ data: {} });

    renderHook(() => useCategory());

    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category")
    );
  });

  it("should return the category list in the API response", async () => {
    const mockCategoryData = {
      success: true,
      message: "All Categories List",
      category: ["Test Category 1", "Test Category 2"],
    };
    axios.get.mockResolvedValue({ data: mockCategoryData });

    const { result } = renderHook(() => useCategory());

    await waitFor(() => expect(result.current).toBe(mockCategoryData.category));
  });

  it("should return an empty list when API call to get all categories fails", async () => {
    axios.get.mockRejectedValue(new Error("Backend error"));

    const { result } = renderHook(() => useCategory());

    await waitFor(() => expect(result.current).toEqual([]));
  });

  it("should display error message when API call to get all categories fails", async () => {
    axios.get.mockRejectedValue(new Error("Backend error"));

    renderHook(() => useCategory());

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Something went wrong in getting categories"
      )
    );
  });
});
