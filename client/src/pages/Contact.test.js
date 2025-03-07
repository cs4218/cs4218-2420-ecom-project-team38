import React from "react";
import { screen, render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import Contact from "./Contact";

jest.mock("../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

describe("Contact Page", () => {
  const renderContactPage = () => {
    render(
      <MemoryRouter>
        <Contact />
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the contact us image, header and text content", () => {
    renderContactPage();

    const imgElement = screen.getByRole("img", { name: "Contact Us" });
    expect(imgElement).toHaveAttribute("src", "/images/contactus.jpeg");
    expect(screen.getByText("CONTACT US")).toBeInTheDocument();
    expect(screen.getByTestId("contact-us-content")).toBeInTheDocument();
  });
});