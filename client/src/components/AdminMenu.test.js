import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import AdminMenu from "./AdminMenu";
import { MemoryRouter } from "react-router-dom";

describe("AdminMenu component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Should render admin menu", () => {
    render(
      <MemoryRouter>
        <AdminMenu />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("link", { name: "Create Product" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Create Category" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Products" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Orders" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Users" })).toBeInTheDocument();
  });

  it("Create product link should be correct", () => {
    render(
      <MemoryRouter>
        <AdminMenu />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("link", { name: "Create Product" })
    ).toHaveAttribute("href", "/dashboard/admin/create-product");
  });

  it("Create category link should be correct", () => {
    render(
      <MemoryRouter>
        <AdminMenu />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("link", { name: "Create Category" })
    ).toHaveAttribute("href", "/dashboard/admin/create-category");
  });

  it("Products link should be correct", () => {
    render(
      <MemoryRouter>
        <AdminMenu />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: "Products" })).toHaveAttribute(
      "href",
      "/dashboard/admin/products"
    );
  });

  it("Orders link should be correct", () => {
    render(
      <MemoryRouter>
        <AdminMenu />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: "Orders" })).toHaveAttribute(
      "href",
      "/dashboard/admin/orders"
    );
  });

  it("Users link should be correct", () => {
    render(
      <MemoryRouter>
        <AdminMenu />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: "Users" })).toHaveAttribute(
      "href",
      "/dashboard/admin/users"
    );
  });
});
