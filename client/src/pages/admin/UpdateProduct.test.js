import React from "react";
import "@testing-library/jest-dom";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import UpdateProduct from "./UpdateProduct";
import toast from "react-hot-toast";
import axios from "axios";

jest.mock("antd", () => {
  const antd = jest.requireActual("antd");
  const Select = ({ children, value, onChange, ...rest }) => (
    <select
      role="combobox"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
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
  useParams: () => ({ slug: "phone" }),
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

jest.mock("../../components/AdminMenu", () => () => <div>Admin Menu</div>);

jest.spyOn(console, "log").mockImplementation(() => {});

const deletePopup = jest.spyOn(window, "confirm");

Object.defineProperty(URL, "createObjectURL", {
  value: jest.fn(() => "mocked-url"),
});

const createMockFile = (filename, filesize, fileType) => {
  const fileBits = new Uint8Array(filesize);
  return new File(fileBits, filename, { type: fileType });
};

describe("UpdateProduct page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.get = jest.fn().mockImplementation((url) => {
      switch (url) {
        case "/api/v1/product/get-product/phone":
          return Promise.resolve({
            data: {
              product: {
                name: "Phone",
                _id: 123,
                description: "Best phone ever",
                price: 2000,
                quantity: 10,
                shipping: true,
                category: { _id: 1 },
              },
            },
          });
        case "/api/v1/category/get-category":
          return Promise.resolve({
            data: {
              success: true,
              category: [
                { name: "Electronics", _id: 1 },
                { name: "Books", _id: 2 },
              ],
            },
          });
        default:
          return Promise.resolve({});
      }
    });
  });

  it("Should render admin menu", async () => {
    render(
      <MemoryRouter>
        <UpdateProduct />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/get-product/phone"
      )
    );
    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category")
    );
    expect(screen.getByText("Admin Menu")).toBeInTheDocument();
  });

  describe("Get all categories", () => {
    it("Should fetch all categories and display them in a dropdown", async () => {
      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith(
          "/api/v1/product/get-product/phone"
        )
      );
      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category")
      );
      const categorySelect = screen.getAllByRole("combobox")[0];
      fireEvent.mouseDown(categorySelect);
      const options = within(categorySelect).getAllByRole("option");
      expect(options).toHaveLength(2);
      expect(options[0]).toHaveTextContent("Electronics");
      expect(options[1]).toHaveTextContent("Books");
    });

    it("Should display an error message if fetching categories API call fails", async () => {
      const mockError = new Error("Failed to fetch categories");
      axios.get = jest.fn().mockImplementation((url) => {
        if (url === "/api/v1/category/get-category") {
          return Promise.reject(mockError);
        }
      });

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith(
          "/api/v1/product/get-product/phone"
        )
      );
      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category")
      );
      expect(console.log).toHaveBeenCalledWith(mockError);
      expect(toast.error).toHaveBeenCalledWith(
        "Something went wrong in getting catgeory"
      );
    });
  });

  describe("Update product form", () => {
    it("Should pre-fill the form with product details", async () => {
      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith(
          "/api/v1/product/get-product/phone"
        )
      );
      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category")
      );
      expect(screen.getAllByRole("combobox")[0]).toHaveValue("1");
      expect(screen.getByPlaceholderText("write a name")).toHaveValue("Phone");
      expect(screen.getByPlaceholderText("write a description")).toHaveValue(
        "Best phone ever"
      );
      expect(screen.getByPlaceholderText("write a Price")).toHaveValue(2000);
      expect(screen.getByPlaceholderText("write a quantity")).toHaveValue(10);
      expect(screen.getAllByRole("combobox")[1]).toHaveValue("1");
      expect(
        screen.getByRole("button", { name: "UPDATE PRODUCT" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "DELETE PRODUCT" })
      ).toBeInTheDocument();
    });

    it("Should allow updating of category", async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith(
          "/api/v1/product/get-product/phone"
        )
      );
      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category")
      );
      const categorySelect = screen.getAllByRole("combobox")[0];
      fireEvent.mouseDown(categorySelect);
      const options = within(categorySelect).getAllByRole("option");
      await user.selectOptions(categorySelect, options[1]);
      expect(options[1]).toHaveValue("2");
      expect(categorySelect).toHaveValue("2");
    });

    it("Should allow updating of image", async () => {
      const user = userEvent.setup();
      const mockFile = createMockFile("test.jpg", 1024, "image/jpeg");

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith(
          "/api/v1/product/get-product/phone"
        )
      );
      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category")
      );
      const fileInput = screen.getByLabelText("Upload Photo");
      await user.upload(fileInput, mockFile);
      expect(screen.getByLabelText("test.jpg")).toBeInTheDocument();
      expect(screen.getByAltText("product_photo")).toBeInTheDocument();
    });

    it("Should allow updating of name", async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith(
          "/api/v1/product/get-product/phone"
        )
      );
      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category")
      );
      const nameInput = screen.getByPlaceholderText("write a name");
      await user.clear(nameInput);
      await user.type(nameInput, "New phone");
      expect(screen.getByPlaceholderText("write a name")).toHaveValue(
        "New phone"
      );
    });

    it("Should allow updating of description", async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith(
          "/api/v1/product/get-product/phone"
        )
      );
      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category")
      );
      const descriptionTextarea = screen.getByPlaceholderText(
        "write a description"
      );
      await user.clear(descriptionTextarea);
      await user.type(
        screen.getByPlaceholderText("write a description"),
        "New phone description"
      );
      expect(screen.getByPlaceholderText("write a description")).toHaveValue(
        "New phone description"
      );
    });

    it("Should allow updating of price", async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith(
          "/api/v1/product/get-product/phone"
        )
      );
      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category")
      );
      const priceInput = screen.getByPlaceholderText("write a Price");
      await user.clear(priceInput);
      await user.type(priceInput, "3000");
      expect(screen.getByPlaceholderText("write a Price")).toHaveValue(3000);
    });

    it("Should allow updating of quantity", async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith(
          "/api/v1/product/get-product/phone"
        )
      );
      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category")
      );
      const quantityInput = screen.getByPlaceholderText("write a quantity");
      await user.clear(quantityInput);
      await user.type(quantityInput, "20");
      expect(screen.getByPlaceholderText("write a quantity")).toHaveValue(20);
    });

    it("Should allow updating of shipping", async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith(
          "/api/v1/product/get-product/phone"
        )
      );
      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category")
      );
      const shippingSelect = screen.getAllByRole("combobox")[1];
      fireEvent.mouseDown(shippingSelect);
      const options = within(shippingSelect).getAllByRole("option");
      await user.selectOptions(shippingSelect, options[0]);
      expect(options[0]).toHaveValue("0");
      expect(screen.getAllByRole("combobox")[1]).toHaveValue("0");
    });

    it("Should display a success message if product is updated successfully and redirect user to product page", async () => {
      const user = userEvent.setup();
      axios.put = jest.fn().mockResolvedValue({ data: { success: true } });

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith(
          "/api/v1/product/get-product/phone"
        )
      );
      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category")
      );
      await user.type(screen.getByPlaceholderText("write a name"), "New phone");
      await user.click(screen.getByRole("button", { name: "UPDATE PRODUCT" }));

      await waitFor(() =>
        expect(axios.put).toHaveBeenCalledWith(
          "/api/v1/product/update-product/123",
          expect.any(FormData)
        )
      );
      expect(mockUseNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
      expect(toast.success).toHaveBeenCalledWith(
        "Product Updated Successfully"
      );
    });

    it("Should display an error message if update is not successful", async () => {
      const user = userEvent.setup();
      axios.put = jest.fn().mockResolvedValue({
        data: { success: false, message: "Failed to update product" },
      });

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith(
          "/api/v1/product/get-product/phone"
        )
      );
      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category")
      );
      await user.clear(screen.getByPlaceholderText("write a name"));
      await user.click(screen.getByRole("button", { name: "UPDATE PRODUCT" }));
      expect(toast.error).toHaveBeenCalledWith("Failed to update product");
    });

    it("Should display an error message if updating product API fails", async () => {
      const user = userEvent.setup();
      const mockError = new Error("Failed to update product");
      axios.put = jest.fn().mockRejectedValue(mockError);

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith(
          "/api/v1/product/get-product/phone"
        )
      );
      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category")
      );
      await user.click(screen.getByRole("button", { name: "UPDATE PRODUCT" }));

      await waitFor(() =>
        expect(axios.put).toHaveBeenCalledWith(
          "/api/v1/product/update-product/123",
          expect.any(FormData)
        )
      );
      expect(console.log).toHaveBeenCalledWith(mockError);
      expect(toast.error).toHaveBeenCalledWith("something went wrong");
    });
  });

  describe("Delete product", () => {
    it("Should display a confirmation modal when delete button is clicked", async () => {
      const user = userEvent.setup();
      deletePopup.mockImplementationOnce(() => true);

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith(
          "/api/v1/product/get-product/phone"
        )
      );
      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category")
      );
      await user.click(screen.getByRole("button", { name: "DELETE PRODUCT" }));
      expect(deletePopup).toHaveBeenCalledWith(
        "Are you sure you want to delete this product?"
      );
    });

    it("Should delete the product and redirect user to products page", async () => {
      const user = userEvent.setup();
      deletePopup.mockImplementationOnce(() => true);
      axios.delete = jest.fn().mockResolvedValue({ data: { success: true } });

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith(
          "/api/v1/product/get-product/phone"
        )
      );
      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category")
      );
      await user.click(screen.getByRole("button", { name: "DELETE PRODUCT" }));

      await waitFor(() =>
        expect(axios.delete).toHaveBeenCalledWith(
          "/api/v1/product/delete-product/123"
        )
      );
      expect(mockUseNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
      expect(toast.success).toHaveBeenCalledWith(
        "Product Deleted Successfully"
      );
    });

    it("Should not delete the product if user cancels the confirmation modal", async () => {
      const user = userEvent.setup();
      deletePopup.mockImplementationOnce(() => false);

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith(
          "/api/v1/product/get-product/phone"
        )
      );
      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category")
      );
      await user.click(screen.getByRole("button", { name: "DELETE PRODUCT" }));
      expect(deletePopup).toHaveBeenCalledWith(
        "Are you sure you want to delete this product?"
      );
      expect(axios.delete).not.toHaveBeenCalled();
    });

    it("Should display an error message if delete product API fails", async () => {
      const user = userEvent.setup();
      deletePopup.mockImplementationOnce(() => true);
      const mockError = new Error("Failed to delete product");
      axios.delete = jest.fn().mockRejectedValue(mockError);

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith(
          "/api/v1/product/get-product/phone"
        )
      );
      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category")
      );
      await user.click(screen.getByRole("button", { name: "DELETE PRODUCT" }));

      await waitFor(() =>
        expect(axios.delete).toHaveBeenCalledWith(
          "/api/v1/product/delete-product/123"
        )
      );
      expect(console.log).toHaveBeenCalledWith(mockError);
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
  });
});
