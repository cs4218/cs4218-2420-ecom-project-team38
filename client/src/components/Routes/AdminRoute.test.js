import React from "react";
import { render, waitFor, screen } from "@testing-library/react";
import AdminRoute from "./AdminRoute";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/auth";
import "@testing-library/jest-dom";

jest.mock("axios");

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("react-router-dom", () => {
  return {
    ...jest.requireActual("react-router-dom"),
    Outlet: () => <div>Outlet rendered</div>,
  };
});

jest.mock("../Spinner", () => () => <div>Spinner rendered</div>);

const renderPrivate = () => {
  return render(
    <MemoryRouter>
      <AdminRoute />
    </MemoryRouter>
  );
};

describe("PrivateRoute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue([[], jest.fn()]);
  });

  test("renders Outlet when authentication is successful", async () => {
    useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
    axios.get.mockResolvedValueOnce({ data: { ok: true } });

    renderPrivate();

    await waitFor(() => {
      expect(screen.getByText("Outlet rendered")).toBeInTheDocument();
    });
  });

  test("renders Spinner when authentication fails", async () => {
    useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
    axios.get.mockResolvedValueOnce({ data: { ok: false } });

    renderPrivate();

    await waitFor(() => {
      expect(screen.getByText("Spinner rendered")).toBeInTheDocument();
    });
  });

  test("renders Spinner immediately when no auth token is provided", () => {
    useAuth.mockReturnValue([{ token: null }, jest.fn()]);
    renderPrivate();
    expect(screen.getByText("Spinner rendered")).toBeInTheDocument();
  });
});
