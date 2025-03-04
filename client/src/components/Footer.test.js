import React from "react";
import "@testing-library/jest-dom";
import { screen, render } from "@testing-library/react";
import Footer from "./Footer";
import { MemoryRouter } from "react-router-dom";

describe("Footer component", () => {
  it("Should render about link", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );
    const aboutLink = screen.getByRole("link", { name: "About" });
    expect(aboutLink).toBeInTheDocument();
    expect(aboutLink).toHaveAttribute("href", "/about");
  });

  it("Should render contact link", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );
    const contactLink = screen.getByRole("link", { name: "Contact" });
    expect(contactLink).toBeInTheDocument();
    expect(contactLink).toHaveAttribute("href", "/contact");
  });

  it("Should render policy link", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );
    const policyLink = screen.getByRole("link", { name: "Privacy Policy" });
    expect(policyLink).toBeInTheDocument();
    expect(policyLink).toHaveAttribute("href", "/policy");
  });
});
