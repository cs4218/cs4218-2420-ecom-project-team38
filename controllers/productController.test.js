import { jest } from "@jest/globals";

import { searchProductController } from "../controllers/productController";
import productModel from "../models/productModel";

jest.mock("../models/productModel");

describe("Product controller", () => {
  describe("Search product controller", () => {
    const mockProducts = [
      { name: "Test product 1", description: "First test product!" },
      { name: "Test product 2", description: "Second test product!" },
    ];

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("Return a list of products that match the search keyword", async () => {
      const req = { params: { keyword: "test" } };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      productModel.find = jest
        .fn()
        .mockReturnValue({ select: jest.fn().mockReturnValue(mockProducts) });

      await searchProductController(req, res);

      expect(productModel.find).toHaveBeenCalledWith({
        $or: [
          { name: { $regex: "test", $options: "i" } },
          { description: { $regex: "test", $options: "i" } },
        ],
      });
      expect(res.json).toHaveBeenCalledWith(mockProducts);
    });

    it("Returns empty list if no products match the search keyword", async () => {
      const req = { params: { keyword: "nonexistent" } };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      productModel.find = jest
        .fn()
        .mockReturnValue({ select: jest.fn().mockReturnValue([]) });

      await searchProductController(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });

    it("Sanitise search keyword before using it in the query", async () => {
      const req = { params: { keyword: ".*" } };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      productModel.find = jest.fn().mockReturnValue({ select: jest.fn() });

      await searchProductController(req, res);

      expect(productModel.find).not.toHaveBeenCalledWith({
        $or: [
          { name: { $regex: ".*", $options: "i" } },
          { description: { $regex: ".*", $options: "i" } },
        ],
      });
    });

    it("Return an error message if the search fails", async () => {
      const req = { params: { keyword: "test" } };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      productModel.find = jest.fn().mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error("Error")),
      });

      await searchProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error In Search Product API",
        error: expect.any(Error),
      });
    });
  });
});
