import React from "react";
import { screen, render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import Policy from "./Policy";

jest.mock("../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

describe("Policy Page", () => {
  const renderPolicyPage = () => {
    render(
      <MemoryRouter>
        <Policy />
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the private policy image, header and text content", () => {
    renderPolicyPage();

    const imgElement = screen.getByRole("img", { name: "Privacy Policy" });
    expect(imgElement).toHaveAttribute("src", "/images/contactus.jpeg");
    expect(screen.getByText("PRIVACY POLICY")).toBeInTheDocument();
    expect(screen.getByTestId("policy-content")).toBeInTheDocument();
  });
});