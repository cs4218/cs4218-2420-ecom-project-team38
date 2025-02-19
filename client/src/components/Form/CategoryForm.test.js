import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CategoryForm from "./CategoryForm";

jest.mock();

describe("CategroryForm component", () => {
  let mockValue;
  let mockSetValue;
  let mockHandleSubmit;

  beforeEach(() => {
    mockValue = "";
    mockSetValue = jest.fn();
    mockHandleSubmit = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("Should render correctly", () => {
    render(
      <CategoryForm
        value={mockValue}
        setValue={mockSetValue}
        handleSubmit={mockHandleSubmit}
      />
    );

    const input = screen.getByPlaceholderText("Enter new category");
    const button = screen.getByRole("button", { name: /submit/i });

    expect(input).toBeInTheDocument();
    expect(button).toBeInTheDocument();
  });

  it("Should reflect user input", async () => {
    const user = userEvent.setup();
    render(
      <CategoryForm
        handleSubmit={mockHandleSubmit}
        value={mockValue}
        setValue={mockSetValue}
      />
    );

    await user.type(screen.getByPlaceholderText("Enter new category"), "test");

    expect(mockSetValue).toHaveBeenCalledTimes(4);
  });

  it("Should submit form after clicking submit", () => {
    render(
      <CategoryForm
        handleSubmit={mockHandleSubmit}
        value={"test"}
        setValue={mockSetValue}
      />
    );

    const button = screen.getByRole("button", { name: /submit/i });
    fireEvent.submit(button);

    expect(mockHandleSubmit).toHaveBeenCalledTimes(1);
  });
});
