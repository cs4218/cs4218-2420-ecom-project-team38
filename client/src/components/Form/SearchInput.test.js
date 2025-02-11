import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import SearchInput from "./SearchInput";
import axios from "axios";
import { useSearch } from "../../context/search";

const mockUseNavigate = jest.fn();

jest.mock("axios");

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockUseNavigate,
}));

const mockSetValues = jest.fn();

jest.mock("../../context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "" }, mockSetValues]), // Correctly mock the return value
}));

describe("SearchInput component", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("Search input should reflect user input", async () => {
    render(<SearchInput />);
    const input = screen.getByPlaceholderText("Search");
    userEvent.type(input, "test");
    expect(mockSetValues).toHaveBeenCalledTimes(4);
  });

  it("Search input not updated when no input is provided", async () => {
    render(<SearchInput />);
    expect(mockSetValues).not.toHaveBeenCalled();
  });

  it("Makes API call on successful form submission", () => {
    useSearch.mockReturnValue([{ keyword: "test", results: [] }, jest.fn()]);
    axios.get.mockResolvedValue({
      data: [{ name: "test", description: "test" }],
    });

    render(<SearchInput />);

    const submitButton = screen.getByRole("button", { name: /search/i });
    userEvent.click(submitButton);
    expect(axios.get).toHaveBeenCalledWith("/api/v1/product/search/test");
  });

  it("Navigates to search page on successful form submission", async () => {
    useSearch.mockReturnValue([{ keyword: "test", results: [] }, jest.fn()]);
    axios.get.mockResolvedValue({
      data: [{ name: "test", description: "test" }],
    });

    render(<SearchInput />);

    const submitButton = screen.getByRole("button", { name: /search/i });
    await waitFor(() => userEvent.click(submitButton));
    expect(mockUseNavigate).toHaveBeenCalledWith("/search");
  });

  it("Should not update search results if API call fails", async () => {
    useSearch.mockReturnValue([{ keyword: "", results: [] }, jest.fn()]);
    axios.get.mockRejectedValue(new Error("Network Error"));

    render(<SearchInput />);

    const submitButton = screen.getByRole("button", { name: /search/i });
    await waitFor(() => userEvent.click(submitButton));
    expect(mockSetValues).not.toHaveBeenCalled();
  });

  it("Should not navigate to search page if API call fails", async () => {
    useSearch.mockReturnValue([{ keyword: "", results: [] }, jest.fn()]);
    axios.get.mockRejectedValue(new Error("Network Error"));

    render(<SearchInput />);

    const submitButton = screen.getByRole("button", { name: /search/i });
    await waitFor(() => userEvent.click(submitButton));
    expect(mockUseNavigate).not.toHaveBeenCalled();
  });
});
