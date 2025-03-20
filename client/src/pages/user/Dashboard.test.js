import React from "react";
import { screen, render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import Dashboard from "./Dashboard";
import { useAuth } from "../../context/auth";

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

jest.mock("../../components/UserMenu", () =>
  jest.fn(() => <div>Mock User Menu</div>)
);

describe("Dashboard Page", () => {
  const renderDashboardPage = () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
  };

  let mockUser;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUser = {
      name: "Test User",
      email: "testuser@gmail.com",
      phone: "98765432",
      address: "123 Test Address",
    };

    useAuth.mockReturnValue([
      { user: mockUser, token: "testtoken" },
      jest.fn(),
    ]);
  });

  it("should render the user menu", () => {
    renderDashboardPage();

    expect(screen.getByText("Mock User Menu")).toBeInTheDocument();
  });

  it("should display the authenticated user's name, email, phone and address", () => {
    renderDashboardPage();

    expect(
      screen.getByText(`User Name : ${mockUser.name}`)
    ).toBeInTheDocument();
    expect(
      screen.getByText(`User Email : ${mockUser.email}`)
    ).toBeInTheDocument();
    expect(
      screen.getByText(`User Contact : ${mockUser.phone}`)
    ).toBeInTheDocument();
    expect(
      screen.getByText(`User Address : ${mockUser.address}`)
    ).toBeInTheDocument();
  });

  it("should not display any name, email, phone or address when the user is unauthenticated", () => {
    useAuth.mockReturnValue([null, jest.fn()]);

    renderDashboardPage();

    expect(screen.getByText("User Name :")).toBeInTheDocument();
    expect(screen.getByText("User Email :")).toBeInTheDocument();
    expect(screen.getByText("User Contact :")).toBeInTheDocument();
    expect(screen.getByText("User Address :")).toBeInTheDocument();
  });
});
