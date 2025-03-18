import React from "react";
import { screen, render, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import * as router from "react-router";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import Categories from "./Categories";
import { useCategory } from "../context/category";

jest.mock("../context/category", () => ({
  useCategory: jest.fn(),
}));

jest.mock("../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

const mockUseNavigate = jest.fn();
jest.spyOn(router, "useNavigate").mockImplementation(() => mockUseNavigate);

describe("Categories Page", () => {
  const renderCategoriesPage = () => {
    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );
  };

  let mockCategory1, mockCategory2;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCategory1 = {
      _id: "test_catid_1",
      name: "Test Category 1",
      slug: "test-category-1",
    };

    mockCategory2 = {
      _id: "test_catid_2",
      name: "Test Category 2",
      slug: "test-category-2",
    };
  });

  it("should display all categories as links", async () => {
    useCategory.mockReturnValue([[mockCategory1, mockCategory2], jest.fn()]);

    renderCategoriesPage();

    const categoryLinks = await screen.findAllByTestId("category-link");
    const category1Link = within(categoryLinks[0]).getByRole("link", {
      name: mockCategory1.name,
    });
    const category2Link = within(categoryLinks[1]).getByRole("link", {
      name: mockCategory2.name,
    });

    expect(categoryLinks).toHaveLength(2);
    expect(category1Link).toBeInTheDocument();
    expect(category2Link).toBeInTheDocument();
  });

  it("should not display any category links when there are no categories", () => {
    useCategory.mockReturnValue([[], jest.fn()]);
    renderCategoriesPage();

    expect(screen.queryAllByTestId("category-link")).toHaveLength(0);
  });

  it("should navigate to the product category page when a category link is clicked", async () => {
    const user = userEvent.setup();
    useCategory.mockReturnValue([[mockCategory1], jest.fn()]);

    renderCategoriesPage();

    const categoryLink = screen.getByTestId("category-link");
    const link = within(categoryLink).getByRole("link", {
      name: mockCategory1.name,
    });
    await user.click(link);

    expect(mockUseNavigate).toHaveBeenCalled();
    expect(mockUseNavigate.mock.calls[0][0]).toBe(
      `/category/${mockCategory1.slug}`
    );
  });
});
