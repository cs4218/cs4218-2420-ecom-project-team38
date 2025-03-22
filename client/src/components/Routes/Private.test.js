import React from "react";
import { render, waitFor, screen } from "@testing-library/react";
import PrivateRoute from "./Private";
import { MemoryRouter, useLocation } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/auth";
import "@testing-library/jest-dom";
import toast from "react-hot-toast";

jest.mock("axios");

jest.mock("react-hot-toast");

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("react-router-dom", () => {
  return {
    ...jest.requireActual("react-router-dom"),
    Outlet: () => <div>Outlet rendered</div>,
    useLocation: jest.fn(() => ({ pathname: "/" })),
  };
});

jest.mock("../Spinner", () => () => <div>Spinner rendered</div>);

Object.defineProperty(window, "localStorage", {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

const renderPrivate = () => {
  return render(
    <MemoryRouter>
      <PrivateRoute />
    </MemoryRouter>
  );
};

describe("PrivateRoute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render Outlet when authentication is successful", async () => {
    useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
    axios.get.mockResolvedValueOnce({ data: { ok: true } });

    renderPrivate();

    await waitFor(() => {
      expect(screen.getByText("Outlet rendered")).toBeInTheDocument();
    });
  });

  it("should render Spinner when authentication fails", async () => {
    useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
    axios.get.mockResolvedValueOnce({ data: { ok: false } });
    const [auth, setAuth] = useAuth();

    renderPrivate();

    await waitFor(() =>
      expect(setAuth).toHaveBeenCalledWith({
        ...auth,
        user: null,
        token: "",
      })
    );
    expect(localStorage.removeItem).toHaveBeenCalledWith("auth");
    expect(toast.error).toHaveBeenCalledWith(
      "Session expired! Please login again."
    );
    expect(screen.getByText("Spinner rendered")).toBeInTheDocument();
  });

  it("should render Spinner immediately when no auth token is provided", () => {
    useAuth.mockReturnValue([{ token: null }, jest.fn()]);
    renderPrivate();
    expect(screen.getByText("Spinner rendered")).toBeInTheDocument();
  });

  it("should render Spinner when user authentication API call fails", async () => {
    useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
    axios.get.mockRejectedValueOnce(new Error("Test Error"));
    const [auth, setAuth] = useAuth();

    renderPrivate();

    await waitFor(() =>
      expect(setAuth).toHaveBeenCalledWith({
        ...auth,
        user: null,
        token: "",
      })
    );
    expect(localStorage.removeItem).toHaveBeenCalledWith("auth");
    expect(toast.error).toHaveBeenCalledWith(
      "Session expired! Please login again."
    );
    expect(screen.getByText("Spinner rendered")).toBeInTheDocument();
  });

  it("should make user authentication API call on location change", async () => {
    useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
    axios.get.mockResolvedValue({ data: { ok: true } });

    renderPrivate();
    useLocation.mockReturnValue({ pathname: "/new-location" });

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(2);
    });
  });
});
