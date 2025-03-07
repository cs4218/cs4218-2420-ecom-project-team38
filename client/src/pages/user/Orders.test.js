import React from "react";
import { screen, render, waitFor, within } from "@testing-library/react";
import axios from "axios";
import toast from "react-hot-toast";
import moment from "moment";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import { useAuth } from "../../context/auth";
import Orders from "./Orders";

jest.mock("axios");

jest.mock("react-hot-toast");

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

jest.mock("../../components/UserMenu", () =>
  jest.fn(() => <div>Mock User Menu</div>)
);

const mockFromNow = jest.fn();
jest.mock("moment", () => {
  return jest.fn(() => ({
    fromNow: mockFromNow,
  }));
});

jest.spyOn(console, "log").mockImplementation(() => {});

describe("Orders Page", () => {
  const renderOrdersPage = () => {
    render(
      <MemoryRouter>
        <Orders />
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the user menu", () => {
    renderOrdersPage();

    expect(screen.getByText("Mock User Menu")).toBeInTheDocument();
  });

  it("should display the orders page header", () => {
    renderOrdersPage();

    expect(screen.getByText("All Orders")).toBeInTheDocument();
  });

  describe("User is authenticated", () => {
    const mockUserName = "Test User";

    beforeEach(() => {
      useAuth.mockReturnValue([
        { user: { name: mockUserName }, token: "testtoken" },
        jest.fn(),
      ]);
    });

    it("should make API call to get the user's orders", async () => {
      axios.get.mockResolvedValue({ data: [] });

      renderOrdersPage();

      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/orders")
      );
    });

    it("should display error message when API call to get orders fails", async () => {
      axios.get.mockRejectedValue(new Error("Backend error"));

      renderOrdersPage();

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith("Something went wrong")
      );
    });

    describe("Rendering of orders", () => {
      let mockProduct1, mockProduct2, mockOrder1, mockOrder2;

      beforeEach(() => {
        mockProduct1 = {
          _id: "test_productid_1",
          name: "Test Product Name 1",
          description: "Test Product Description 1",
          price: 4.99,
        };

        mockProduct2 = {
          _id: "test_productid_2",
          name: "Test Product Name 2",
          description:
            "Test Product Description 2 is longer than 30 characters",
          price: 27,
        };

        mockOrder1 = {
          _id: "test_orderid_1",
          status: "Not Processed",
          buyer: { name: mockUserName },
          createdAt: "2025-01-13T17:02:55.129Z",
          payment: { success: true },
          products: [mockProduct1, mockProduct2],
        };

        mockOrder2 = {
          _id: "test_orderid_2",
          status: "Shipped",
          buyer: { name: mockUserName },
          createdAt: "2025-02-04T13:42:16.741Z",
          payment: { success: false },
          products: [mockProduct2],
        };
      });

      describe("Order details", () => {
        it("should render a table for each order", async () => {
          axios.get.mockResolvedValue({ data: [mockOrder1, mockOrder2] });

          renderOrdersPage();

          const tables = await screen.findAllByRole("table");
          expect(tables).toHaveLength(2);
        });

        it("should render column headers for the order table", async () => {
          axios.get.mockResolvedValue({ data: [mockOrder1] });

          renderOrdersPage();

          expect(
            await screen.findByRole("columnheader", { name: "#" })
          ).toBeInTheDocument();
          expect(
            await screen.findByRole("columnheader", { name: "Status" })
          ).toBeInTheDocument();
          expect(
            await screen.findByRole("columnheader", { name: "Buyer" })
          ).toBeInTheDocument();
          expect(
            await screen.findByRole("columnheader", { name: "Date" })
          ).toBeInTheDocument();
          expect(
            await screen.findByRole("columnheader", { name: "Payment" })
          ).toBeInTheDocument();
          expect(
            await screen.findByRole("columnheader", { name: "Quantity" })
          ).toBeInTheDocument();
        });

        it("should display sequential order number for each order table", async () => {
          axios.get.mockResolvedValue({ data: [mockOrder1, mockOrder2] });

          renderOrdersPage();

          const tables = await screen.findAllByRole("table");
          const table1Rows = within(tables[0]).getAllByRole("row");
          const table2Rows = within(tables[1]).getAllByRole("row");
          const table1FirstRowCells = within(table1Rows[1]).getAllByRole(
            "cell"
          );
          const table2FirstRowCells = within(table2Rows[1]).getAllByRole(
            "cell"
          );

          expect(table1FirstRowCells[0]).toHaveTextContent("1");
          expect(table2FirstRowCells[0]).toHaveTextContent("2");
        });

        it("should display order status in order table", async () => {
          axios.get.mockResolvedValue({ data: [mockOrder1] });

          renderOrdersPage();

          const table = await screen.findByRole("table");
          const tableRows = within(table).getAllByRole("row");
          const firstRowCells = within(tableRows[1]).getAllByRole("cell");

          expect(firstRowCells[1]).toHaveTextContent(mockOrder1.status);
        });

        it("should display buyer name in order table", async () => {
          axios.get.mockResolvedValue({ data: [mockOrder1] });

          renderOrdersPage();

          const table = await screen.findByRole("table");
          const tableRows = within(table).getAllByRole("row");
          const firstRowCells = within(tableRows[1]).getAllByRole("cell");

          expect(firstRowCells[2]).toHaveTextContent(mockOrder1.buyer.name);
        });

        it("should display relative order time in order table", async () => {
          const mockOrderTime = "2 days ago";
          mockFromNow.mockReturnValue(mockOrderTime);
          axios.get.mockResolvedValue({ data: [mockOrder1] });

          renderOrdersPage();

          const table = await screen.findByRole("table");
          const tableRows = within(table).getAllByRole("row");
          const firstRowCells = within(tableRows[1]).getAllByRole("cell");

          expect(moment).toHaveBeenCalledWith(mockOrder1.createdAt);
          expect(mockFromNow).toHaveBeenCalled();
          expect(firstRowCells[3]).toHaveTextContent(mockOrderTime);
        });

        it("should display payment as 'Success' in order table when it is successful", async () => {
          axios.get.mockResolvedValue({ data: [mockOrder1] });

          renderOrdersPage();

          const table = await screen.findByRole("table");
          const tableRows = within(table).getAllByRole("row");
          const firstRowCells = within(tableRows[1]).getAllByRole("cell");

          expect(firstRowCells[4]).toHaveTextContent("Success");
        });

        it("should display payment as 'Failed' in order table when it is unsuccessful", async () => {
          axios.get.mockResolvedValue({ data: [mockOrder2] });

          renderOrdersPage();

          const table = await screen.findByRole("table");
          const tableRows = within(table).getAllByRole("row");
          const firstRowCells = within(tableRows[1]).getAllByRole("cell");

          expect(firstRowCells[4]).toHaveTextContent("Failed");
        });

        it("should display product quantity in order table", async () => {
          axios.get.mockResolvedValue({ data: [mockOrder1] });

          renderOrdersPage();

          const table = await screen.findByRole("table");
          const tableRows = within(table).getAllByRole("row");
          const firstRowCells = within(tableRows[1]).getAllByRole("cell");

          expect(firstRowCells[5]).toHaveTextContent(
            mockOrder1.products.length
          );
        });

        it("should not render any tables when there are no orders", async () => {
          axios.get.mockResolvedValue({ data: [] });

          renderOrdersPage();

          await waitFor(() =>
            expect(screen.queryAllByRole("table")).toHaveLength(0)
          );
        });
      });

      describe("Product details", () => {
        it("should render all products of an order", async () => {
          axios.get.mockResolvedValue({ data: [mockOrder1] });

          renderOrdersPage();

          const products = await screen.findAllByTestId("orders-product-card");
          expect(products).toHaveLength(2);
        });

        it("should display product photo, name, description and price", async () => {
          axios.get.mockResolvedValue({ data: [mockOrder1] });

          renderOrdersPage();

          const imgElement = await screen.findByRole("img", {
            name: mockProduct1.name,
          });
          expect(imgElement).toHaveAttribute(
            "src",
            `/api/v1/product/product-photo/${mockProduct1._id}`
          );
          expect(
            await screen.findByText(mockProduct1.name)
          ).toBeInTheDocument();
          expect(
            await screen.findByText(mockProduct1.description)
          ).toBeInTheDocument();
          expect(
            await screen.findByText(`Price : ${mockProduct1.price}`)
          ).toBeInTheDocument();
        });

        it("should truncate product description when it is longer than 30 characters", async () => {
          axios.get.mockResolvedValue({ data: [mockOrder1] });

          renderOrdersPage();

          expect(
            await screen.findByText(
              `${mockProduct2.description.substring(0, 30)}...`
            )
          ).toBeInTheDocument();
        });

        it("should not render any products when there are no orders", async () => {
          axios.get.mockResolvedValue({ data: [] });

          renderOrdersPage();

          await waitFor(() =>
            expect(screen.queryAllByTestId("orders-product-card")).toHaveLength(
              0
            )
          );
        });
      });
    });
  });

  describe("User is unauthenticated", () => {
    beforeEach(() => {
      useAuth.mockReturnValue([null, jest.fn()]);
    });

    it("should not make API call to get the user's orders", async () => {
      renderOrdersPage();

      await waitFor(() =>
        expect(axios.get).not.toHaveBeenCalledWith("/api/v1/auth/orders")
      );
    });
  });
});
