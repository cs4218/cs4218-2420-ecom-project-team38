import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import CreateCategory from "./CreateCategory";
import axios from "axios";
import toast from "react-hot-toast";

jest.mock("axios");

jest.mock("react-hot-toast");

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

describe("CreateCategory page", () => {
  describe("Create category", () => {
    beforeEach(() => {
      axios.post = jest.fn().mockResolvedValue({ data: { success: true } });
      axios.get = jest
        .fn()
        .mockResolvedValueOnce({
          data: { success: true, category: [{ _id: 1, name: "Book" }] },
        })
        .mockResolvedValueOnce({
          data: {
            success: true,
            category: [
              { _id: 1, name: "Book" },
              { _id: 2, name: "Electronics" },
            ],
          },
        });
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("Should render create category form fields correctly", async () => {
      render(
        <MemoryRouter>
          <CreateCategory />
        </MemoryRouter>
      );

      await waitFor(() => screen.getByText("Book")); // wait for initial state to be set
      const input = screen.getByPlaceholderText("Enter new category");
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue("");
      expect(
        screen.getByRole("button", { name: /submit/i })
      ).toBeInTheDocument();
    });

    it("Should display success message after successfully creating a category", async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <CreateCategory />
        </MemoryRouter>
      );

      await waitFor(() => screen.findByText("Book")); // wait for initial state to be set
      await user.type(
        screen.getByPlaceholderText("Enter new category"),
        "Electronics"
      );
      await user.click(screen.getByRole("button", { name: /submit/i }));

      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/category/create-category",
        { name: "Electronics" }
      );
      expect(toast.success).toHaveBeenCalledWith("Electronics is created");
    });

    it("Should render updated category list after creating a new category", async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <CreateCategory />
        </MemoryRouter>
      );

      await waitFor(() => screen.findByText("Book")); // wait for initial state to be set
      await user.type(
        screen.getByPlaceholderText("Enter new category"),
        "Electronics"
      );
      await user.click(screen.getByRole("button", { name: /submit/i }));

      expect(screen.getByText("Book")).toBeInTheDocument();
      expect(screen.getByText("Electronics")).toBeInTheDocument();
    });

    it("Should display error message if category creation fails", async () => {
      const user = userEvent.setup();
      axios.post = jest.fn().mockResolvedValue({
        data: { success: false, message: "Error creating category" },
      });

      render(
        <MemoryRouter>
          <CreateCategory />
        </MemoryRouter>
      );

      await waitFor(() => screen.findByText("Book")); // wait for initial state to be set
      await user.type(
        screen.getByPlaceholderText("Enter new category"),
        "Electronics"
      );
      await user.click(screen.getByRole("button", { name: /submit/i }));

      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/category/create-category",
        { name: "Electronics" }
      );
      expect(toast.error).toHaveBeenCalledWith("Error creating category");
    });

    it("Should display error message if category creation API call fails", async () => {
      const user = userEvent.setup();
      const mockError = new Error("Network Error");
      axios.post = jest.fn().mockRejectedValue(mockError);
      const consolelog = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});

      render(
        <MemoryRouter>
          <CreateCategory />
        </MemoryRouter>
      );

      await waitFor(() => screen.findByText("Book")); // wait for initial state to be set
      await user.type(
        screen.getByPlaceholderText("Enter new category"),
        "Electronics"
      );
      await user.click(screen.getByRole("button", { name: /submit/i }));

      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/category/create-category",
        { name: "Electronics" }
      );
      expect(consolelog).toHaveBeenCalledWith(mockError);
      expect(toast.error).toHaveBeenCalledWith(
        "somthing went wrong in input form"
      );
    });

    xit("API should not be called when input is empty", async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <CreateCategory />
        </MemoryRouter>
      );

      await waitFor(() => screen.findByText("Book")); // wait for initial state to be set
      await user.click(screen.getByRole("button", { name: /submit/i }));

      expect(axios.post).not.toHaveBeenCalled();
    });
  });

  describe("Get all categories", () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it("Should render category list correctly", async () => {
      axios.get = jest.fn().mockResolvedValue({
        data: { success: true, category: [{ _id: 1, name: "Book" }] },
      });

      render(
        <MemoryRouter>
          <CreateCategory />
        </MemoryRouter>
      );

      expect(await screen.findByText("Book")).toBeInTheDocument();
      expect(screen.getByRole("table").children[1].children.length).toBe(1); // one category row in tbody
    });

    it("Should display error message if category list API call fails", async () => {
      const mockError = new Error("Network Error");
      axios.get = jest.fn().mockRejectedValue(mockError);
      const consolelog = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});

      render(
        <MemoryRouter>
          <CreateCategory />
        </MemoryRouter>
      );

      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category")
      );
      expect(consolelog).toHaveBeenCalledWith(mockError);
      expect(toast.error).toHaveBeenCalledWith(
        "Something went wrong in getting catgeory"
      );
    });
  });

  describe("Update category", () => {
    beforeEach(() => {
      axios.put = jest.fn().mockResolvedValue({ data: { success: true } });
      axios.get = jest
        .fn()
        .mockResolvedValueOnce({
          data: { success: true, category: [{ _id: 1, name: "Book" }] },
        })
        .mockResolvedValueOnce({
          data: { success: true, category: [{ _id: 1, name: "Books" }] },
        });
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("Should render update category form fields correctly", async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <CreateCategory />
        </MemoryRouter>
      );

      await waitFor(() => screen.findByText("Book")); // wait for initial state to be set
      await user.click(screen.getByRole("button", { name: /edit/i }));
      expect(screen.getByDisplayValue("Book")).toBeInTheDocument();
    });

    it("Should display success message after successfully updating a category", async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <CreateCategory />
        </MemoryRouter>
      );

      await waitFor(() => screen.findByText("Book")); // wait for initial state to be set
      await user.click(screen.getByRole("button", { name: /edit/i }));
      await user.type(screen.getByDisplayValue("Book"), "s");
      await user.click(screen.getAllByRole("button", { name: /submit/i })[1]);

      expect(axios.put).toHaveBeenCalledWith(
        "/api/v1/category/update-category/1",
        { name: "Books" }
      );
      expect(toast.success).toHaveBeenCalledWith("Books is updated");
    });

    it("Should render updated category list after updating a category", async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <CreateCategory />
        </MemoryRouter>
      );

      await waitFor(() => screen.findByText("Book")); // wait for initial state to be set
      await user.click(screen.getByRole("button", { name: /edit/i }));
      await user.type(screen.getByDisplayValue("Book"), "s");
      await user.click(screen.getAllByRole("button", { name: /submit/i })[1]);

      expect(screen.queryByText("Book")).not.toBeInTheDocument();
      expect(screen.getByText("Books")).toBeInTheDocument();
    });

    it("Should display error message if category update fails", async () => {
      const user = userEvent.setup();
      axios.put = jest.fn().mockResolvedValue({
        data: { success: false, message: "Error updating category" },
      });

      render(
        <MemoryRouter>
          <CreateCategory />
        </MemoryRouter>
      );

      await waitFor(() => screen.findByText("Book")); // wait for initial state to be set
      await user.click(screen.getByRole("button", { name: /edit/i }));
      await user.type(screen.getByDisplayValue("Book"), "s");
      await user.click(screen.getAllByRole("button", { name: /submit/i })[1]);

      expect(axios.put).toHaveBeenCalledWith(
        "/api/v1/category/update-category/1",
        { name: "Books" }
      );
      expect(toast.error).toHaveBeenCalledWith("Error updating category");
    });

    it("Should display error message if category update API call fails", async () => {
      const user = userEvent.setup();
      axios.put = jest.fn().mockRejectedValue(new Error("Network Error"));

      render(
        <MemoryRouter>
          <CreateCategory />
        </MemoryRouter>
      );
      await waitFor(() => screen.findByText("Book")); // wait for initial state to be set
      await user.click(screen.getByRole("button", { name: /edit/i }));
      await user.click(screen.getAllByRole("button", { name: /submit/i })[1]);

      expect(axios.put).toHaveBeenCalledWith(
        "/api/v1/category/update-category/1",
        { name: "Book" }
      );
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });

    xit("API should not be called when input is empty", async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <CreateCategory />
        </MemoryRouter>
      );

      await waitFor(() => screen.findByText("Book")); // wait for initial state to be set
      await user.click(screen.getByRole("button", { name: /edit/i }));
      await user.clear(screen.getByDisplayValue("Book"));
      await user.click(screen.getAllByRole("button", { name: /submit/i })[1]);

      expect(axios.put).not.toHaveBeenCalled();
    });
  });

  describe("Delete category", () => {
    beforeEach(() => {
      axios.delete = jest.fn().mockResolvedValue({ data: { success: true } });
      axios.get = jest
        .fn()
        .mockResolvedValueOnce({
          data: { success: true, category: [{ _id: 1, name: "Book" }] },
        })
        .mockResolvedValueOnce({ data: { success: true, category: [] } });
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("Should display success message after successfully deleting a category", async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <CreateCategory />
        </MemoryRouter>
      );

      await waitFor(() => screen.findByText("Book")); // wait for initial state to be set
      await user.click(screen.getByRole("button", { name: /delete/i }));

      expect(axios.delete).toHaveBeenCalledWith(
        "/api/v1/category/delete-category/1"
      );
      expect(toast.success).toHaveBeenCalledWith("category is deleted");
    });

    it("Should render updated category list after deleting a category", async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <CreateCategory />
        </MemoryRouter>
      );

      await waitFor(() => screen.findByText("Book")); // wait for initial state to be set
      await user.click(screen.getByRole("button", { name: /delete/i }));

      expect(screen.queryByText("Book")).not.toBeInTheDocument();
      expect(screen.getByRole("table").children[1].children.length).toBe(0); // no category row in tbody
    });

    it("Should display error message if category deletion fails", async () => {
      const user = userEvent.setup();
      axios.delete = jest.fn().mockResolvedValue({
        data: { success: false, message: "Cannot delete category" },
      });

      render(
        <MemoryRouter>
          <CreateCategory />
        </MemoryRouter>
      );

      await waitFor(() => screen.findByText("Book")); // wait for initial state to be set
      await user.click(screen.getByRole("button", { name: /delete/i }));

      expect(toast.error).toHaveBeenCalledWith("Cannot delete category");
    });

    it("Should display error message if API fails", async () => {
      const user = userEvent.setup();
      axios.delete = jest.fn().mockRejectedValue(new Error("Network Error"));

      render(
        <MemoryRouter>
          <CreateCategory />
        </MemoryRouter>
      );

      await waitFor(() => screen.findByText("Book")); // wait for initial state to be set
      await user.click(screen.getByRole("button", { name: /delete/i }));

      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
  });
});
