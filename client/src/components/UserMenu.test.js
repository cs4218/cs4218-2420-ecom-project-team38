import React from "react";
import { screen, render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import * as router from "react-router";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import UserMenu from "./UserMenu";

const mockUseNavigate = jest.fn();
jest.spyOn(router, "useNavigate").mockImplementation(() => mockUseNavigate);

describe("User Menu Component", () => {
  const renderUserMenuComponent = () => {
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render user menu title and navigation links", () => {
    renderUserMenuComponent();

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByText("Orders")).toBeInTheDocument();
  });

  it("should navigate to the profile page when profile link is clicked", async () => {
    const user = userEvent.setup();
    renderUserMenuComponent();

    await user.click(screen.getByRole("link", { name: /profile/i }));

    expect(mockUseNavigate).toHaveBeenCalled();
    expect(mockUseNavigate.mock.calls[0][0]).toEqual("/dashboard/user/profile");
  });

  it("should navigate to the orders page when order link is clicked", async () => {
    const user = userEvent.setup();
    renderUserMenuComponent();

    await user.click(screen.getByRole("link", { name: /orders/i }));

    expect(mockUseNavigate).toHaveBeenCalled();
    expect(mockUseNavigate.mock.calls[0][0]).toEqual("/dashboard/user/orders");
  });
});
