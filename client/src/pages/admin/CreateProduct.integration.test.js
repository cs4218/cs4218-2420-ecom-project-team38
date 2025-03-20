import React from "react";
import "@testing-library/jest-dom";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  within,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateProduct from "./CreateProduct";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Products from "./Products";
import axios from "axios";
import { AuthProvider } from "../../context/auth";
import AdminRoute from "../../components/Routes/AdminRoute";
import Login from "../Auth/Login";

jest.mock("axios");

jest.mock("react-hot-toast");

jest.mock("../../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

Object.defineProperty(URL, "createObjectURL", {
  value: jest.fn(() => "mocked-url"),
});

Object.defineProperty(window, "localStorage", {
  value: { getItem: jest.fn() },
});

const createMockFile = (filename, filesize, fileType) => {
  const fileBits = new Uint8Array(filesize);
  return new File(fileBits, filename, { type: fileType });
};

describe("CreateProduct Integration Test", () => {
  const mockProduct = {
    _id: 1,
    name: "product1",
    description: "description1",
    price: 100,
    quantity: 10,
    photo: "photo",
    category: "category",
    shipping: "1",
  };

  describe("Admin protected page", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("Should be accessible by an admin user", async () => {
      const categories = [{ _id: 1, name: "Books" }];
      localStorage.getItem = jest
        .fn()
        .mockReturnValue(
          JSON.stringify({ user: { role: 1 }, token: "admin-token" })
        );
      axios.get = jest
        .fn()
        .mockResolvedValueOnce({ data: { ok: true } }) // admin-auth
        .mockResolvedValueOnce({
          data: { success: true, category: categories },
        }); // get-category

      render(
        <MemoryRouter initialEntries={["/dashboard/admin/create-product"]}>
          <AuthProvider>
            <Routes>
              <Route path="/dashboard" element={<AdminRoute />}>
                <Route
                  path="admin/create-product"
                  element={<CreateProduct />}
                />
              </Route>
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/admin-auth")
      );
      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category")
      );
      expect(
        screen.getByRole("heading", { name: "Create Product", level: 1 })
      ).toBeInTheDocument();
    });

    it("Should redirect non-admin user to login page", async () => {
      localStorage.getItem = jest
        .fn()
        .mockReturnValue(
          JSON.stringify({ user: { role: 0 }, token: "user-token" })
        );
      axios.get = jest.fn().mockResolvedValue({ data: { ok: false } });

      render(
        <MemoryRouter initialEntries={["/dashboard/admin/create-product"]}>
          <AuthProvider>
            <Routes>
              <Route path="/dashboard" element={<AdminRoute />}>
                <Route
                  path="admin/create-product"
                  element={<CreateProduct />}
                />
              </Route>
              <Route path="login" element={<Login />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/admin-auth")
      );
      act(() => jest.advanceTimersByTime(3000));
      expect(await screen.findByText("LOGIN FORM")).toBeInTheDocument();
    });
  });

  describe("Product creation", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      axios.get = jest.fn().mockImplementation((url) => {
        switch (url) {
          case "/api/v1/category/get-category":
            return Promise.resolve({
              data: { success: true, category: [{ _id: 1, name: "Books" }] },
            });
          case "/api/v1/product/get-product":
            return Promise.resolve({ data: { products: [mockProduct] } });
          default:
            return Promise.resolve({});
        }
      });
      axios.post = jest.fn().mockResolvedValue({ data: { success: true } });
    });

    it("Should display newly created product", async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter initialEntries={["/dashboard/admin/create-product"]}>
          <Routes>
            <Route
              path="/dashboard/admin/create-product"
              element={<CreateProduct />}
            />
            <Route path="/dashboard/admin/products" element={<Products />} />
          </Routes>
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
        screen.getByPlaceholderText("write a name"),
        mockProduct.name
      );
      await user.type(
        screen.getByPlaceholderText("write a description"),
        mockProduct.description
      );
      await user.type(
        screen.getByPlaceholderText("write a Price"),
        mockProduct.price.toString()
      );
      await user.type(
        screen.getByPlaceholderText("write a quantity"),
        mockProduct.quantity.toString()
      );
      fireEvent.mouseDown(screen.getAllByRole("combobox")[1]); // open shipping select options
      await user.click(await screen.findByText("Yes"));
      await user.click(screen.getByRole("button", { name: "CREATE PRODUCT" }));

      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product")
      );

      const products = screen.getByTestId("products-list").children;
      expect(products).toHaveLength(1);
      expect(
        within(products[0]).getByText(mockProduct.name)
      ).toBeInTheDocument();
      expect(
        within(products[0]).getByText(mockProduct.description)
      ).toBeInTheDocument();
    });
  });
});
