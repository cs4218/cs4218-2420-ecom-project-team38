import { expect, jest } from "@jest/globals";
import categoryModel from "../models/categoryModel";
import {
  createCategoryController,
  updateCategoryController,
  deleteCategoryController,
} from "./categoryController";

describe("Category controller", () => {
  describe("Create category controller", () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it("Allow creating of unique category", async () => {
      const req = { body: { name: "test" } };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };

      categoryModel.findOne = jest.fn().mockResolvedValue(null);
      categoryModel.prototype.save = jest
        .fn()
        .mockResolvedValue({ name: "test", slug: "test" });

      await createCategoryController(req, res);

      expect(categoryModel.findOne).toHaveBeenCalledWith({ name: "test" });
      expect(categoryModel.prototype.save).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "new category created",
        category: { name: "test", slug: "test" },
      });
    });

    it("Should not allow creating of duplicate category", async () => {
      const req = { body: { name: "test" } };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };

      categoryModel.findOne = jest
        .fn()
        .mockResolvedValue({ name: "test", slug: "test" });

      await createCategoryController(req, res);

      expect(categoryModel.findOne).toHaveBeenCalledWith({ name: "test" });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Category Already Exisits",
      });
      expect(categoryModel.prototype.save).not.toHaveBeenCalled();
    });

    it("Should not allow creating of category without name", async () => {
      const req = { body: {} };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };

      await createCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({ message: "Name is required" });
      expect(categoryModel.prototype.save).not.toHaveBeenCalled();
    });

    it("Should not allow creating of category when name contains whitespaces only", async () => {
      const req = { body: { name: " " } };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };

      await createCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({ message: "Name is required" });
      expect(categoryModel.prototype.save).not.toHaveBeenCalled();
    });

    it("Should handle error when creating category", async () => {
      const req = { body: { name: "test" } };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };

      const mockError = new Error("Error creating category");
      categoryModel.findOne = jest.fn().mockResolvedValue(null);
      categoryModel.prototype.save = jest.fn().mockRejectedValue(mockError);

      await createCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        errro: mockError,
        message: "Errro in Category",
      });
    });
  });

  describe("Update category controller", () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it("Should update category successfully", async () => {
      const req = { body: { name: "test" }, params: { id: "1" } };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
      const mockCategory = { name: "test", slug: "test" };

      categoryModel.findByIdAndUpdate = jest
        .fn()
        .mockResolvedValue(mockCategory);

      await updateCategoryController(req, res);

      expect(categoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "1",
        mockCategory,
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        messsage: "Category Updated Successfully",
        category: mockCategory,
      });
    });

    it("Should handle error when updating category", async () => {
      const req = { body: { name: "test" }, params: { id: "1" } };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };

      const mockError = new Error("Error updating category");
      categoryModel.findByIdAndUpdate = jest.fn().mockRejectedValue(mockError);

      await updateCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: mockError,
        message: "Error while updating category",
      });
    });
  });

  describe("Delete category controller", () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it("Should delete category successfully", async () => {
      const req = { params: { id: "1" } };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };

      categoryModel.findByIdAndDelete = jest.fn();

      await deleteCategoryController(req, res);

      expect(categoryModel.findByIdAndDelete).toHaveBeenCalledWith("1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Category Deleted Successfully",
      });
    });

    it("Should handle error when deleting category", async () => {
      const req = { params: { id: "1" } };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };

      const mockError = new Error("Error deleting category");
      categoryModel.findByIdAndDelete = jest.fn().mockRejectedValue(mockError);

      await deleteCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error while deleting category",
        error: mockError,
      });
    });
  });
});
