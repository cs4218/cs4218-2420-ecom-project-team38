import React from "react";
import "@testing-library/jest-dom";
import { act, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Spinner from "./Spinner";

jest.useFakeTimers();

const mockUseNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockUseNavigate,
  useLocation: jest.fn(() => ({ pathname: "/spinner" })),
}));

describe("Spinner component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Should render spinner with countdown", () => {
    render(
      <MemoryRouter>
        <Spinner />
      </MemoryRouter>
    );
    expect(
      screen.getByText("Redirecting to you in 3 seconds")
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("Should redirect to login page after countdown", () => {
    render(
      <MemoryRouter initialEntries={["/spinner"]}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/spinner" element={<Spinner />} />
        </Routes>
      </MemoryRouter>
    );
    act(() => jest.advanceTimersByTime(3000));
    expect(mockUseNavigate).toHaveBeenCalledWith("/login", {
      state: "/spinner",
    });
  });

  it("Should not redirect to login page before countdown", () => {
    render(
      <MemoryRouter initialEntries={["/spinner"]}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/spinner" element={<Spinner />} />
        </Routes>
      </MemoryRouter>
    );
    act(() => jest.advanceTimersByTime(2000));
    expect(
      screen.getByText("Redirecting to you in 1 second")
    ).toBeInTheDocument();
    expect(mockUseNavigate).not.toHaveBeenCalled();
  });
});
