import { expect, jest } from "@jest/globals";
import categoryModel from "../models/categoryModel";
import {
  createCategoryController,
  updateCategoryController,
  categoryController,
  singleCategoryController,
  deleteCategoryController,
} from "./categoryController";
import productModel from "../models/productModel";

jest.mock("../models/categoryModel");

jest.mock("../models/productModel");

describe("Category controller", () => {
  describe("Create category controller", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("Allow creating of unique category", async () => {
      const req = { body: { name: "test" } };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };

      categoryModel.findOne = jest.fn().mockResolvedValueOnce(null);
      categoryModel.prototype.save = jest
        .fn()
        .mockResolvedValueOnce({ name: "test", slug: "test" });

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
        .mockResolvedValueOnce({ name: "test", slug: "test" });

      await createCategoryController(req, res);

      expect(categoryModel.findOne).toHaveBeenCalledWith({ name: "test" });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Category Already Exists",
      });
      expect(categoryModel.prototype.save).not.toHaveBeenCalled();
    });

    it("Should not allow creating of category without name", async () => {
      const req = { body: {} };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };

      await createCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ message: "Name is required" });
      expect(categoryModel.prototype.save).not.toHaveBeenCalled();
    });

    it("Should not allow creating of category when name contains whitespaces only", async () => {
      const req = { body: { name: " " } };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };

      await createCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ message: "Name is required" });
      expect(categoryModel.prototype.save).not.toHaveBeenCalled();
    });

    it("Should handle error when creating category", async () => {
      const req = { body: { name: "test" } };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };

      const mockError = new Error("Error creating category");
      categoryModel.findOne = jest.fn().mockResolvedValueOnce(null);
      categoryModel.prototype.save = jest.fn().mockRejectedValueOnce(mockError);
      jest.spyOn(console, "log").mockImplementation(() => {});

      await createCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        errro: mockError,
        message: "Error in Category",
      });
    });
  });

  describe("Update category controller", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("Should update category successfully", async () => {
      const req = { body: { name: "test" }, params: { id: "1" } };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
      const mockCategory = { name: "test", slug: "test" };

      categoryModel.findOne = jest.fn().mockResolvedValueOnce(null);
      categoryModel.findByIdAndUpdate = jest
        .fn()
        .mockResolvedValueOnce(mockCategory);

      await updateCategoryController(req, res);

      expect(categoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "1",
        mockCategory,
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Category Updated Successfully",
        category: mockCategory,
      });
    });

    it("Should not result in duplicate categories", async () => {
      const req = { body: { name: "test" }, params: { id: "1" } };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };

      categoryModel.findOne = jest
        .fn()
        .mockResolvedValueOnce({ name: "test", slug: "test" });
      categoryModel.findByIdAndUpdate = jest.fn().mockResolvedValueOnce();

      await updateCategoryController(req, res);

      expect(categoryModel.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(categoryModel.findOne).toHaveBeenCalledWith({
        $and: [{ name: "test" }, { _id: { $ne: "1" } }],
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Category Already Exists",
      });
    });

    it("Should not allow updating of category with name containing whitespaces only", async () => {
      const req = { body: { name: " " }, params: { id: "1" } };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };

      categoryModel.findByIdAndUpdate = jest.fn();

      await updateCategoryController(req, res);

      expect(categoryModel.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Name is required",
      });
    });

    it("Should not allow updating of category that does not exist", async () => {
      const req = { body: { name: "test" }, params: { id: "1" } };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };

      categoryModel.findOne = jest.fn().mockResolvedValueOnce(null);
      categoryModel.findByIdAndUpdate = jest.fn().mockResolvedValueOnce(null);

      await updateCategoryController(req, res);

      expect(categoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "1",
        { name: "test", slug: "test" },
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Category does not exist",
      });
    });

    it("Should handle error when updating category", async () => {
      const req = { body: { name: "test" }, params: { id: "1" } };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };

      const mockError = new Error("Error updating category");
      categoryModel.findOne = jest.fn().mockResolvedValueOnce(null);
      categoryModel.findByIdAndUpdate = jest
        .fn()
        .mockRejectedValueOnce(mockError);
      jest.spyOn(console, "log").mockImplementation(() => {});

      await updateCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: mockError,
        message: "Error while updating category",
      });
    });
  });

  describe("All category controller", () => {
    const req = {};
    let res;

    beforeEach(() => {
      jest.clearAllMocks();

      res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
        json: jest.fn(),
      };
    });

    it("Should get all categories from the database", async () => {
      categoryModel.find = jest.fn();

      await categoryController(req, res);

      expect(categoryModel.find).toHaveBeenCalledWith({});
    });

    it("should send successful response with all categories returned from the database find query", async () => {
      const mockCategories = [
        {
          _id: "test_catid_1",
          name: "Test Category 1",
          slug: "test-category-1",
        },
        {
          _id: "test_catid_2",
          name: "Test Category 2",
          slug: "test-category-2",
        },
      ];

      categoryModel.find = jest.fn().mockResolvedValue(mockCategories);

      await categoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "All Categories List",
        category: mockCategories,
      });
    });

    it("Should send error response when error getting all categories from database", async () => {
      const dbError = new Error("Database error while getting all categories");
      categoryModel.find = jest.fn().mockRejectedValue(dbError);

      await categoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error while getting all categories",
        error: dbError,
      });
    });
  });

  describe("Single category controller", () => {
    const mockCategorySlug = "test-category-slug";
    let req, res;

    beforeEach(() => {
      jest.clearAllMocks();

      req = { params: { slug: mockCategorySlug } };

      res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
        json: jest.fn(),
      };
    });

    it("Should get the single category from the database", async () => {
      categoryModel.findOne = jest.fn();

      await singleCategoryController(req, res);

      expect(categoryModel.findOne).toHaveBeenCalledWith({
        slug: mockCategorySlug,
      });
    });

    it("should send successful response with the category returned from the database find query", async () => {
      const mockCategory = {
        _id: "test_catid",
        name: "Test Category",
        slug: "test-category",
      };

      categoryModel.findOne = jest.fn().mockResolvedValue(mockCategory);

      await singleCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Get Single Category Successfully",
        category: mockCategory,
      });
    });

    it("Should send error response when category does not exist", async () => {
      categoryModel.findOne = jest.fn().mockResolvedValue(null);

      await singleCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Category does not exist",
      });
    });

    it("Should send error response when error getting single category from database", async () => {
      const dbError = new Error("Database error while getting single category");
      categoryModel.findOne = jest.fn().mockRejectedValue(dbError);

      await singleCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error while getting single category",
        error: dbError,
      });
    });
  });

  describe("Delete category controller", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("Should delete category successfully", async () => {
      const req = { params: { id: "1" } };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };

      productModel.findOne = jest.fn().mockResolvedValueOnce(null);
      categoryModel.findByIdAndDelete = jest
        .fn()
        .mockResolvedValueOnce({ name: "test" });

      await deleteCategoryController(req, res);

      expect(categoryModel.findByIdAndDelete).toHaveBeenCalledWith("1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Category Deleted Successfully",
      });
    });

    it("Should not allow deleting of category that has existing products", async () => {
      const mockProduct = {
        _id: "test_productid",
        name: "Test Product Name",
        description: "Test Product Description",
        price: 200,
        category: { _id: "1", name: "Test Category" },
        quantity: 5,
        shipping: false,
      };
      const req = { params: { id: "1" } };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };

      productModel.findOne = jest.fn().mockResolvedValueOnce(mockProduct);
      categoryModel.findByIdAndDelete = jest.fn();

      await deleteCategoryController(req, res);

      expect(categoryModel.findByIdAndDelete).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "There are existing products in this category",
      });
    });

    it("Should not allow deleting of category that does not exist", async () => {
      const req = { params: { id: "1" } };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };

      productModel.findOne = jest.fn().mockResolvedValueOnce(null);
      categoryModel.findByIdAndDelete = jest.fn().mockResolvedValueOnce(null);

      await deleteCategoryController(req, res);

      expect(categoryModel.findByIdAndDelete).toHaveBeenCalledWith("1");
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Category does not exist",
      });
    });

    it("Should handle error when deleting category", async () => {
      const req = { params: { id: "1" } };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
      jest.spyOn(console, "log").mockImplementation(() => {});

      const mockError = new Error("Error deleting category");
      productModel.findOne = jest.fn().mockResolvedValueOnce(null);
      categoryModel.findByIdAndDelete = jest
        .fn()
        .mockRejectedValueOnce(mockError);

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
