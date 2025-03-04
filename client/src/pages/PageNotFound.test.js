import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PageNotFound from "./PageNotFound";

jest.mock("../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

describe("PageNotFound page", () => {
  it("Should render correctly", () => {
    render(
      <MemoryRouter>
        <PageNotFound />
      </MemoryRouter>
    );
    const link = screen.getByRole("link", { name: "Go Back" });
    expect(
      screen.getByRole("heading", { name: "404", level: 1 })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Oops ! Page Not Found", level: 2 })
    ).toBeInTheDocument();
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/");
  });
});
