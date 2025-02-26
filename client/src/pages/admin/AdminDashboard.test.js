import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import AdminDashboard from "./AdminDashboard";
import { useAuth } from "../../context/auth";

const mockName = "Admin user";
const mockEmail = "adminuser@example.com";
const mockPhone = "88888888";

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(() => [
    {
      user: {
        name: mockName,
        email: mockEmail,
        phone: mockPhone,
      },
    },
    jest.fn(),
  ]),
}));

jest.mock("../../components/AdminMenu", () => () => <div>Admin Menu</div>);

jest.mock("../../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

describe("AdminDashboard page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Should render AdminMenu", () => {
    render(<AdminDashboard />);
    expect(screen.getByText("Admin Menu")).toBeInTheDocument;
  });

  it("Should render admin user details", () => {
    render(<AdminDashboard />);
    expect(
      screen.getByRole("heading", {
        name: `Admin Name : ${mockName}`,
        level: 3,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: `Admin Email : ${mockEmail}`,
        level: 3,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: `Admin Contact : ${mockPhone}`,
        level: 3,
      })
    ).toBeInTheDocument();
  });

  it("Admin details not rendered if details are not available", () => {
    useAuth.mockReturnValue([{}, jest.fn()]);
    render(<AdminDashboard />);
    expect(
      screen.getByRole("heading", { name: "Admin Name :", level: 3 })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Admin Email :", level: 3 })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Admin Contact :", level: 3 })
    ).toBeInTheDocument();
  });
});
