import React from "react";
import { screen, render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import * as router from "react-router";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import Pagenotfound from "./Pagenotfound";

jest.mock("../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

const mockUseNavigate = jest.fn();
jest.spyOn(router, "useNavigate").mockImplementation(() => mockUseNavigate);

describe("Page Not Found", () => {
  const renderPageNotFound = () => {
    render(
      <MemoryRouter>
        <Pagenotfound />
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the page not found code and message", () => {
    renderPageNotFound();

    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText("Oops! Page Not Found")).toBeInTheDocument();
  });

  it("should navigate to the home page when back to home link is clicked", async () => {
    const user = userEvent.setup();

    renderPageNotFound();

    await user.click(screen.getByRole("link", { name: /back to home/i }));

    expect(mockUseNavigate).toHaveBeenCalled();
    expect(mockUseNavigate.mock.calls[0][0]).toBe("/");
  });
});
