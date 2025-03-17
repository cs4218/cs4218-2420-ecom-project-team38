import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UpdateProduct from "./UpdateProduct";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Products from "./Products";
import axios from "axios";

jest.mock("axios");

jest.mock("react-hot-toast");

jest.mock("../../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

const deletePopup = jest.spyOn(window, "confirm");

describe("UpdateProduct Integration Test", () => {
  const mockProduct = {
    _id: 1,
    name: "product1",
    slug: "product1",
    description: "description1",
    price: 100,
    quantity: 10,
    photo: "photo",
    category: "category",
    shipping: "1",
  };
  const updatedProduct = {
    ...mockProduct,
    name: "updatedProduct",
    slug: "updatedProduct",
  };
  const mockCategories = [{ _id: 1, name: "Books" }];

  describe("Update product", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      axios.get = jest
        .fn()
        .mockResolvedValueOnce({
          data: { success: true, products: [mockProduct] },
        })
        .mockResolvedValueOnce({
          data: { product: mockProduct },
        })
        .mockResolvedValueOnce({
          data: { success: true, category: mockCategories },
        })
        .mockResolvedValueOnce({
          data: { success: true, products: [updatedProduct] },
        });
      axios.put = jest.fn().mockResolvedValue({ data: { success: true } });
    });

    it("Product can be updated", async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter initialEntries={["/dashboard/admin/products"]}>
          <Routes>
            <Route
              path="/dashboard/admin/product/:slug"
              element={<UpdateProduct />}
            />
            <Route path="/dashboard/admin/products" element={<Products />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product")
      );

      // select product to update

      let products = screen.getByTestId("products-list");
      const productLink = products.children[0];
      await user.click(productLink);

      // update product

      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith(
          "/api/v1/product/get-product/product1"
        )
      );
      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category")
      );

      await user.clear(screen.getByPlaceholderText("write a name"));
      await user.type(
        screen.getByPlaceholderText("write a name"),
        updatedProduct.name
      );
      await user.click(screen.getByText("UPDATE PRODUCT"));

      await waitFor(() =>
        expect(axios.put).toHaveBeenCalledWith(
          `/api/v1/product/update-product/${mockProduct._id}`,
          expect.any(FormData)
        )
      );

      // check if updated product is displayed

      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product")
      );
      products = screen.getByTestId("products-list");
      const updatedProductLink = products.children[0];
      expect(within(updatedProductLink).getByText(updatedProduct.name))
        .toBeInTheDocument;
      expect(within(updatedProductLink).getByText(updatedProduct.description))
        .toBeInTheDocument;
    });
  });

  describe("Delete product", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      axios.get = jest
        .fn()
        .mockResolvedValueOnce({
          data: { success: true, products: [mockProduct] },
        })
        .mockResolvedValueOnce({
          data: { product: mockProduct },
        })
        .mockResolvedValueOnce({
          data: { success: true, category: mockCategories },
        })
        .mockResolvedValueOnce({
          data: { success: true, products: [] },
        });
      axios.delete = jest.fn().mockResolvedValue({ data: { success: true } });
    });

    it("Product can be deleted", async () => {
      const user = userEvent.setup();
      deletePopup.mockImplementation(() => true);

      render(
        <MemoryRouter initialEntries={["/dashboard/admin/products"]}>
          <Routes>
            <Route
              path="/dashboard/admin/product/:slug"
              element={<UpdateProduct />}
            />
            <Route path="/dashboard/admin/products" element={<Products />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product")
      );

      // select product to delete

      let products = screen.getByTestId("products-list");
      const productLink = products.children[0];
      await user.click(productLink);

      // delete product

      await user.click(screen.getByRole("button", { name: "DELETE PRODUCT" }));
      await waitFor(() =>
        expect(axios.delete).toHaveBeenCalledWith(
          `/api/v1/product/delete-product/${mockProduct._id}`
        )
      );

      // check if product is deleted

      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product")
      );
      products = screen.getByTestId("products-list");
      expect(products.children).toHaveLength(0);
    });
  });
});
