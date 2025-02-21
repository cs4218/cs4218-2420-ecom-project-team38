import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import CreateProduct from "./CreateProduct";
import toast from "react-hot-toast";
import axios from "axios";

jest.mock("antd", () => {
  const antd = jest.requireActual("antd");
  const Select = ({ children, onChange, ...rest }) => (
    <select role="combobox" onChange={(e) => onChange(e.target.value)}>
      {children}
    </select>
  );
  Select.Option = ({ children, ...rest }) => (
    <option role="option" {...rest}>
      {children}
    </option>
  );
  return {
    ...antd,
    Select,
  };
});

jest.mock("axios");

jest.mock("react-hot-toast");

const mockUseNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockUseNavigate,
}));

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(() => [null, jest.fn()]), // Mock useAuth hook to return null state and a mock function for setAuth
}));

jest.mock("../../context/cart", () => ({
  useCart: jest.fn(() => [null, jest.fn()]), // Mock useCart hook to return null state and a mock function
}));

jest.mock("../../context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]), // Mock useSearch hook to return null state and a mock function
}));

jest.mock("../../hooks/useCategory", () =>
  jest.fn(() => [{ name: "test", slug: "test" }])
);

jest.mock("../../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

jest.spyOn(console, "log").mockImplementation(() => {});

window.matchMedia =
  window.matchMedia ||
  function () {
    return {
      matches: false,
      addListener: function () {},
      removeListener: function () {},
    };
  };

Object.defineProperty(URL, "createObjectURL", {
  value: jest.fn(() => "mocked-url"),
});

const createMockFile = (filename, filesize, fileType) => {
  const fileBits = new Uint8Array(filesize);
  return new File(fileBits, filename, { type: fileType });
};

describe("CreateProduct page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Should create a product and redirect user to products page", async () => {
    const user = userEvent.setup();
    axios.get = jest.fn().mockResolvedValueOnce({
      data: {
        success: true,
        category: [{ _id: 1, name: "Books", slug: "books" }],
      },
    });
    axios.post = jest.fn().mockResolvedValueOnce({ data: { success: true } });

    render(
      <MemoryRouter>
        <CreateProduct />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category")
    );

    await waitFor(() =>
      expect(screen.getAllByRole("combobox")).toHaveLength(2)
    );
    fireEvent.mouseDown(screen.getAllByRole("combobox")[0]); // open category select options
    await user.click(await screen.findByText("Books")); // select Books category
    await user.type(screen.getByPlaceholderText("write a name"), "First Book");
    const mockImageFile = createMockFile("test.jpg", 1024, "image/jpeg");
    await user.upload(screen.getByLabelText("Upload Photo"), mockImageFile);
    await user.type(
      screen.getByPlaceholderText("write a description"),
      "New Book"
    );
    await user.type(screen.getByPlaceholderText("write a Price"), "20");
    await user.type(screen.getByPlaceholderText("write a quantity"), "10");
    fireEvent.mouseDown(screen.getAllByRole("combobox")[1]); // open shipping select options
    await user.click(await screen.findByText("Yes")); // select Books category
    await user.click(screen.getByRole("button", { name: "CREATE PRODUCT" }));

    expect(axios.post).toHaveBeenCalledWith(
      "/api/v1/product/create-product",
      expect.any(FormData)
    );
    expect(toast.success).toHaveBeenCalledWith("Product Created Successfully");
    expect(mockUseNavigate).toHaveBeenCalledTimes(1);
    expect(mockUseNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
  });

  it("Should show error message if product creation fails and not redirect user", async () => {
    const user = userEvent.setup();
    axios.get = jest.fn().mockResolvedValueOnce({
      data: {
        success: true,
        category: [{ _id: 1, name: "Books", slug: "books" }],
      },
    });
    axios.post = jest.fn().mockResolvedValueOnce({
      data: { success: false, message: "Name is required" },
    });

    render(
      <MemoryRouter>
        <CreateProduct />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category")
    );
    fireEvent.mouseDown(screen.getAllByRole("combobox")[0]); // open category select options
    await user.click(await screen.findByText("Books")); // select Books category
    const mockImageFile = createMockFile("test.jpg", 1024, "image/jpeg");
    await user.upload(screen.getByLabelText("Upload Photo"), mockImageFile);
    await user.type(
      screen.getByPlaceholderText("write a description"),
      "New Book"
    );
    await user.type(screen.getByPlaceholderText("write a Price"), "20");
    await user.type(screen.getByPlaceholderText("write a quantity"), "10");
    fireEvent.mouseDown(screen.getAllByRole("combobox")[1]); // open shipping select options
    await user.click(await screen.findByText("Yes")); // select Books category
    await user.click(screen.getByRole("button", { name: "CREATE PRODUCT" }));

    expect(axios.post).toHaveBeenCalledWith(
      "/api/v1/product/create-product",
      expect.any(FormData)
    );
    expect(toast.error).toHaveBeenCalledWith("Name is required");
    expect(mockUseNavigate).not.toHaveBeenCalled();
  });

  it("Should show error message if product creation API fails and not redirect user", async () => {
    const user = userEvent.setup();
    const mockError = new Error("Error creating product");
    axios.get = jest.fn().mockResolvedValueOnce({
      data: {
        success: true,
        category: [{ _id: 1, name: "Books", slug: "books" }],
      },
    });
    axios.post = jest.fn().mockRejectedValueOnce(mockError);

    render(
      <MemoryRouter>
        <CreateProduct />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category")
    );
    fireEvent.mouseDown(screen.getAllByRole("combobox")[0]); // open category select options
    await user.click(await screen.findByText("Books")); // select Books category
    await user.type(screen.getByPlaceholderText("write a name"), "First Book");
    const mockImageFile = createMockFile("test.jpg", 1024, "image/jpeg");
    await user.upload(screen.getByLabelText("Upload Photo"), mockImageFile);
    await user.type(
      screen.getByPlaceholderText("write a description"),
      "New Book"
    );
    await user.type(screen.getByPlaceholderText("write a Price"), "20");
    await user.type(screen.getByPlaceholderText("write a quantity"), "10");
    fireEvent.mouseDown(screen.getAllByRole("combobox")[1]); // open shipping select options
    await user.click(await screen.findByText("Yes")); // select Books category
    await user.click(screen.getByRole("button", { name: "CREATE PRODUCT" }));

    expect(axios.post).toHaveBeenCalledWith(
      "/api/v1/product/create-product",
      expect.any(FormData)
    );
    expect(toast.error).toHaveBeenCalledWith("something went wrong");
    expect(console.log).toHaveBeenCalledWith(mockError);
    expect(mockUseNavigate).not.toHaveBeenCalled();
  });

  it("Should show error message if category fetch API fails", async () => {
    const mockError = new Error("Error fetching categories");
    axios.get = jest.fn().mockRejectedValueOnce(mockError);

    render(
      <MemoryRouter>
        <CreateProduct />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category")
    );
    expect(toast.error).toHaveBeenCalledWith(
      "Something went wrong in getting category"
    );
    expect(console.log).toHaveBeenCalledWith(mockError);
  });
});
