import { describe, jest } from "@jest/globals";
import braintree from "braintree";
import {
  getProductController,
  getSingleProductController,
  productPhotoController,
  relatedProductController,
  searchProductController,
  braintreeTokenController,
} from "../controllers/productController";
import productModel from "../models/productModel";

jest.mock("../models/productModel");

describe("Product controller", () => {
  describe("Get product controller", () => {
    it("Gets a list of all the products", async () => {
      const mockProducts = [
        { name: "Test product", description: "Test product!" },
        { name: "Another test product", description: "Another test product!" },
      ];

      productModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockProducts),
      });

      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await getProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: mockProducts,
        counTotal: mockProducts.length,
        message: "All Products",
      });

      expect(productModel.find().populate).toHaveBeenCalledWith("category");
      expect(productModel.find().select).toHaveBeenCalledWith("-photo");
      expect(productModel.find().limit).toHaveBeenCalledWith(12);
      expect(productModel.find().sort).toHaveBeenCalledWith({ createdAt: -1 });
    });

    it("Returns an error when an exception occurs from fetching all the products", async () => {
      productModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest
          .fn()
          .mockRejectedValue(
            new Error("Something went wrong with the database")
          ),
      });

      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await getProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error in getting products",
        error: "Something went wrong with the database",
      });
    });
  });

  describe("Get single product controller", () => {
    it("Gets a single product", async () => {
      const mockProduct = { name: "", description: "" };

      productModel.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockProduct),
      });

      const req = { params: { slug: "test-product" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await getSingleProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Single Product Fetched",
        product: mockProduct,
      });

      expect(productModel.find().select).toHaveBeenCalledWith("-photo");
      expect(productModel.find().populate).toHaveBeenCalledWith("category");
    });

    it("Returns an error when an exception occurs from fetching a single product", async () => {
      productModel.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest
          .fn()
          .mockRejectedValue(
            new Error("Something went wrong with the database")
          ),
      });

      const req = { params: { slug: "test-product" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await getSingleProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error while getting single product",
        error: new Error("Something went wrong with the database"),
      });
    });
  });

  describe("Product photo controller", () => {
    it("Get photo of a single product", async () => {
      const mockProduct = {
        photo: {
          data: Buffer.from("mock-image-data"),
          contentType: "image/png",
        },
      };

      productModel.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockProduct),
      });

      const req = { params: { pid: "67ace09e434c9d2b82b55b85" } };
      const res = {
        set: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await productPhotoController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(mockProduct.photo.data);
      expect(productModel.findById).toHaveBeenCalledWith(req.params.pid);
      expect(productModel.findById().select).toHaveBeenCalledWith("photo");
    });

    it("Returns an error when an exception occurs from getting photo of a product", async () => {
      productModel.findById = jest.fn().mockReturnValue({
        select: jest
          .fn()
          .mockRejectedValue(
            new Error("Something went wrong while fetching the photo")
          ),
      });

      const req = { params: { pid: "67ace20a02fdf529e74bfe34" } };
      const res = {
        set: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await productPhotoController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error while getting photo",
        error: new Error("Something went wrong while fetching the photo"),
      });
    });
  });

  describe("Related product controller", () => {
    it("Get related products of a single product", async () => {
      const mockProducts = [
        { name: "Test Product", description: "This is a test product" },
        {
          name: "Another test product",
          description: "This is another test product.",
        },
      ];

      productModel.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockProducts),
      });

      // use randomly generated ObjectId strings as the params
      const req = {
        params: {
          pid: "67acd933090850c6d850da8e",
          cid: "67acd93e0db23898c084de1c",
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await relatedProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: mockProducts,
      });

      expect(productModel.find).toHaveBeenCalledWith({
        category: req.params.cid,
        _id: { $ne: req.params.pid },
      });
      expect(productModel.find().select).toHaveBeenCalledWith("-photo");
      expect(productModel.find().limit).toHaveBeenCalledWith(3);
      expect(productModel.find().populate).toHaveBeenCalledWith("category");
    });

    it("Return an error when an exception occurs from fetching related products", async () => {
      productModel.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest
          .fn()
          .mockRejectedValue(new Error("Could not find related products")),
      });

      const req = {
        params: {
          pid: "67acd933090850c6d850da8e",
          cid: "67acd93e0db23898c084de1c",
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await relatedProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error while getting related product",
        error: new Error("Could not find related products"),
      });
    });
  });

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

      expect(productModel.find).toHaveBeenCalledWith({
        $or: [
          { name: { $regex: "\\.\\*", $options: "i" } },
          { description: { $regex: "\\.\\*", $options: "i" } },
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

      const mockedError = new Error("Database error");
      productModel.find = jest.fn().mockReturnValue({
        select: jest.fn().mockRejectedValue(mockedError),
      });

      await searchProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error In Search Product API",
        error: mockedError,
      });
    });
  });

  describe("Braintree token controller", () => {
    it("Generates a client token for Braintree", async () => {
      jest.spyOn(braintree, "BraintreeGateway").mockImplementation(() => ({
        clientToken: {
          generate: (_, callback) =>
            callback(null, { clientToken: "mock-braintree-token" }),
        },
      }));

      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
          
      await braintreeTokenController(req, res);

      console.log(res.send.mock.calls);
          
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({ clientToken: "mock-braintree-token" });
    })
  })
});
