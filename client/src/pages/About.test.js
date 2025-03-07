import React from "react";
import { screen, render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import About from "./About";

jest.mock("../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

describe("About Page", () => {
  const renderAboutPage = () => {
    render(
      <MemoryRouter>
        <About />
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the about us image, header and text content", () => {
    renderAboutPage();

    const imgElement = screen.getByRole("img", { name: "About Us" });
    expect(imgElement).toHaveAttribute("src", "/images/about.jpeg");
    expect(screen.getByText("ABOUT US")).toBeInTheDocument();
    expect(screen.getByTestId("about-us-content")).toBeInTheDocument();
  });
});
