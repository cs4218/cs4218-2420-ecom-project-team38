import { describe, expect, jest } from "@jest/globals";
import mongoose from "mongoose";
import braintree from "braintree";
import fs from "fs";
import {
  createProductController,
  updateProductController,
  productFiltersController,
  getProductController,
  getSingleProductController,
  deleteProductController,
  productPhotoController,
  productCountController,
  productListController,
  productCategoryController,
  relatedProductController,
  searchProductController,
  braintreeTokenController,
  brainTreePaymentController,
} from "../controllers/productController";
import categoryModel from "../models/categoryModel";
import productModel from "../models/productModel";
import orderModel from "../models/orderModel";

jest.mock("../models/categoryModel");
jest.mock("../models/productModel");
jest.mock("../models/orderModel");

describe("Product controller", () => {
  describe("Create product controller", () => {
    it("Creates a new product with a photo if all necessary details are given and within the limit ", async () => {
      jest
        .spyOn(fs, "readFileSync")
        .mockReturnValue(Buffer.from("mock-file-data"));

      const mockSlug = "test-product";

      const mockProduct = {
        _id: "67b98fd0235fa3cf8e4bbe72",
        name: "test product",
        description: "This is a test product with a photo",
        price: 50,
        category: "67b9927c50c661ec1f06c2fc",
        quantity: 1,
        shipping: true,
      };

      const mockPhoto = {
        path: "mock-photo-path",
        type: "image/png",
        size: 1000,
      };

      const mockSave = jest.fn().mockResolvedValue({
        ...mockProduct,
        slug: mockSlug,
        photo: {
          data: fs.readFileSync(mockPhoto.path),
          contentType: mockPhoto.type,
        },
      });

      jest.spyOn(productModel.prototype, "save").mockImplementation(mockSave);

      const req = {
        fields: { ...mockProduct },
        files: { photo: mockPhoto },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await createProductController(req, res);

      expect(fs.readFileSync).toHaveBeenCalledWith(mockPhoto.path);
      expect(res.status).toHaveBeenCalledWith(201);

      const sentResponse = res.send.mock.calls[0][0];
      expect(sentResponse.success).toBe(true);
      expect(sentResponse.message).toBe("Product Created Successfully");

      const sentProduct = sentResponse.products;
      expect(sentProduct.name).toBe(mockProduct.name);
      expect(sentProduct.description).toBe(mockProduct.description);
      expect(sentProduct.price).toBe(mockProduct.price);
      expect(sentProduct.category.toString()).toBe(mockProduct.category);
      expect(sentProduct.quantity).toBe(mockProduct.quantity);
      expect(sentProduct.shipping).toBe(mockProduct.shipping);
      expect(sentProduct.slug).toBe(mockSlug);
      expect(sentProduct.photo.contentType).toBe(mockPhoto.type);
      expect(Buffer.from(sentProduct.photo.data).toString()).toBe(
        Buffer.from("mock-file-data").toString()
      );
    });

    it("Creates a new product without a photo if all necessary details are given and within the limit ", async () => {
      jest
        .spyOn(fs, "readFileSync")
        .mockReturnValue(Buffer.from("mock-file-data"));

      const mockSlug = "test-product";

      const mockProduct = {
        _id: "67b98fd0235fa3cf8e4bbe72",
        name: "test product",
        description: "This is a test product without a photo",
        price: 200,
        category: "67b9927c50c661ec1f06c2fc",
        quantity: 5,
        shipping: false,
      };

      const mockSave = jest.fn().mockResolvedValue({
        ...mockProduct,
        slug: mockSlug,
      });

      jest.spyOn(productModel.prototype, "save").mockImplementation(mockSave);

      const req = {
        fields: { ...mockProduct },
        files: { photo: null },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await createProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(201);

      const sentResponse = res.send.mock.calls[0][0];
      expect(sentResponse.success).toBe(true);
      expect(sentResponse.message).toBe("Product Created Successfully");

      const sentProduct = sentResponse.products;
      expect(sentProduct.name).toBe(mockProduct.name);
      expect(sentProduct.description).toBe(mockProduct.description);
      expect(sentProduct.price).toBe(mockProduct.price);
      expect(sentProduct.category.toString()).toBe(mockProduct.category);
      expect(sentProduct.quantity).toBe(mockProduct.quantity);
      expect(sentProduct.shipping).toBe(mockProduct.shipping);
      expect(sentProduct.slug).toBe(mockSlug);
    });

    it("Raises an error when an exception occurs from creating a product", async () => {
      const mockError = new Error(
        "Something went wrong when creating the product"
      );

      jest.spyOn(productModel.prototype, "save").mockRejectedValue(mockError);

      const req = {
        fields: {
          name: "test product",
          description: "test description",
          price: 100,
          category: "test category",
          quantity: 10,
          shipping: true,
        },
        files: {
          photo: {
            path: "mock-photo-path",
            type: "image/png",
            size: 100,
          },
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await createProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error in creating product",
        error: mockError,
      });
    });

    it("Does not create a product if the name is missing", async () => {
      const mockProduct = {
        _id: "67ba0da9a6aac64d80e7a1c1",
        description: "This is a test product without a name",
        price: 50,
        category: "67ba0db37d0621608b2f79e2",
        quantity: 1,
        shipping: true,
      };

      const req = {
        fields: { ...mockProduct },
        files: {
          photo: { path: "mock-photo-path", type: "image/png", size: 100 },
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await createProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        error: "Name is Required",
      });
    });

    it("Does not create a product if the description is missing", async () => {
      const mockProduct = {
        _id: "67ba0e19b5b64a493c0f08aa",
        name: "test product without description",
        price: 30,
        category: "67ba0e2118a0d48a87a8b2da",
        quantity: 2,
        shipping: false,
      };

      const req = {
        fields: { ...mockProduct },
        files: {
          photo: { path: "mock-photo-path", type: "image/png", size: 200 },
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await createProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        error: "Description is Required",
      });
    });

    it("Does not create a product if the price is missing", async () => {
      const mockProduct = {
        _id: "67ba0ef4eb3e31ba78754958",
        name: "test product without price",
        description: "This is a test product without a price",
        category: "67ba0eec6cc1ffa6d221791f",
        quantity: 6,
        shipping: true,
      };

      const req = {
        fields: { ...mockProduct },
        files: {
          photo: { path: "mock-photo-path", type: "image/png", size: 200 },
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await createProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        error: "Price is Required",
      });
    });

    it("Does not create a product if the category is missing", async () => {
      const mockProduct = {
        _id: "67ba0e19b5b64a493c0f08aa",
        name: "test product without category",
        description: "This is a test product without a category",
        price: 60,
        quantity: 5,
        shipping: false,
      };

      const req = {
        fields: { ...mockProduct },
        files: {
          photo: { path: "mock-photo-path", type: "image/jpg", size: 200 },
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await createProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        error: "Category is Required",
      });
    });

    it("Does not create a product if the quantity is missing", async () => {
      const mockProduct = {
        _id: "67ba0e19b5b64a493c0f08aa",
        name: "test product without quantity",
        description: "This is a test product without a quantity",
        price: 60,
        category: "67ba0eec6cc1ffa6d221791f",
        shipping: false,
      };

      const req = {
        fields: { ...mockProduct },
        files: {
          photo: { path: "mock-photo-path", type: "image/jpg", size: 700 },
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await createProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        error: "Quantity is Required",
      });
    });

    it("Creates a new product if the photo's size is equal to the 1mb size limit and all other necessary details are present", async () => {
      jest
        .spyOn(fs, "readFileSync")
        .mockReturnValue(Buffer.from("mock-file-data"));

      const mockSlug = "test-product";

      const mockProduct = {
        _id: "67b98fd0235fa3cf8e4bbe72",
        name: "test product",
        description: "This is a test product",
        price: 25,
        category: "67b9927c50c661ec1f06c2fc",
        quantity: 30,
        shipping: true,
      };

      const mockPhoto = {
        path: "mock-photo-path",
        type: "image/png",
        size: 1000000,
      };

      const mockSave = jest.fn().mockResolvedValue({
        ...mockProduct,
        slug: mockSlug,
        photo: {
          data: fs.readFileSync(mockPhoto.path),
          contentType: mockPhoto.type,
        },
      });

      jest.spyOn(productModel.prototype, "save").mockImplementation(mockSave);

      const req = {
        fields: { ...mockProduct },
        files: { photo: mockPhoto },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await createProductController(req, res);

      expect(fs.readFileSync).toHaveBeenCalledWith(mockPhoto.path);
      expect(res.status).toHaveBeenCalledWith(201);

      const sentResponse = res.send.mock.calls[0][0];
      expect(sentResponse.success).toBe(true);
      expect(sentResponse.message).toBe("Product Created Successfully");

      const sentProduct = sentResponse.products;
      expect(sentProduct.name).toBe(mockProduct.name);
      expect(sentProduct.description).toBe(mockProduct.description);
      expect(sentProduct.price).toBe(mockProduct.price);
      expect(sentProduct.category.toString()).toBe(mockProduct.category);
      expect(sentProduct.quantity).toBe(mockProduct.quantity);
      expect(sentProduct.shipping).toBe(mockProduct.shipping);
      expect(sentProduct.slug).toBe(mockSlug);
      expect(sentProduct.photo.contentType).toBe(mockPhoto.type);
      expect(Buffer.from(sentProduct.photo.data).toString()).toBe(
        Buffer.from("mock-file-data").toString()
      );
    });

    it("Does not create a product if the photo's size just exceeds the 1mb size limit", async () => {
      const mockProduct = {
        _id: "67ba0e19b5b64a493c0f08aa",
        name: "test product without category",
        description:
          "This is a test product with a photo that is too large in size",
        price: 60,
        category: "67ba0db37d0621608b2f79e2",
        quantity: 5,
        shipping: false,
      };

      const req = {
        fields: { ...mockProduct },
        files: {
          photo: { path: "mock-photo-path", type: "image/jpg", size: 1000001 },
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await createProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        error: "Photo is Required and should be less then 1mb",
      });
    });

    it("Does not create a product if the photo's size exceeds the 1mb size limit by a lot", async () => {
      const mockProduct = {
        _id: "67ba0e19b5b64a493c0f08aa",
        name: "test product without category",
        description:
          "This is a test product with a photo that is too large in size",
        price: 60,
        category: "67ba0db37d0621608b2f79e2",
        quantity: 5,
        shipping: false,
      };

      const req = {
        fields: { ...mockProduct },
        files: {
          photo: { path: "mock-photo-path", type: "image/jpg", size: 2000000 },
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await createProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        error: "Photo is Required and should be less then 1mb",
      });
    });
  });

  describe("Update product controller", () => {
    it("Updates a product if all necessary details are given and within the limit", async () => {
      jest
        .spyOn(fs, "readFileSync")
        .mockReturnValue(Buffer.from("mock-file-data"));

      const mockProductId = "67bac8f8c3398a1d89886761";
      const mockSlug = "updated-product";

      const mockUpdatedProduct = {
        name: "Updated Product",
        description: "This is an updated product with a photo",
        price: 100,
        category: "67babe1aeae58eb5646d28fb",
        quantity: 10,
        shipping: true,
      };

      const mockPhoto = {
        path: "updated-photo-path",
        size: 2000,
        type: "image/jpeg",
      };

      const mockUpdatedProductResponse = {
        ...mockUpdatedProduct,
        _id: mockProductId,
        slug: mockSlug,
        photo: {
          data: "mockPhotoData",
          contentType: mockPhoto.type,
        },
      };

      productModel.findByIdAndUpdate = jest
        .fn()
        .mockResolvedValue(mockUpdatedProductResponse);

      const mockSave = jest.fn().mockResolvedValue(mockUpdatedProductResponse);
      mockUpdatedProductResponse.save = mockSave;

      const req = {
        params: { pid: mockProductId },
        fields: mockUpdatedProduct,
        files: { photo: mockPhoto },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await updateProductController(req, res);

      expect(fs.readFileSync).toHaveBeenCalledWith(mockPhoto.path);
      expect(mockSave).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Product Updated Successfully",
        products: mockUpdatedProductResponse,
      });
    });

    it("Updates a product without photo if all necessary details are given and within the limit", async () => {
      jest
        .spyOn(fs, "readFileSync")
        .mockReturnValue(Buffer.from("mock-file-data"));

      const mockProductId = "67bac8f8c3398a1d89886761";
      const mockSlug = "updated-product";

      const mockUpdatedProduct = {
        name: "Updated Product",
        description: "This is an updated product without a photo",
        price: 200,
        category: "67babe1aeae58eb5646d28fb",
        quantity: 100,
        shipping: false,
      };

      const mockUpdatedProductResponse = {
        ...mockUpdatedProduct,
        _id: mockProductId,
        slug: mockSlug,
      };

      productModel.findByIdAndUpdate = jest
        .fn()
        .mockResolvedValue(mockUpdatedProductResponse);

      const mockSave = jest.fn().mockResolvedValue(mockUpdatedProductResponse);
      mockUpdatedProductResponse.save = mockSave;

      const req = {
        params: { pid: mockProductId },
        fields: mockUpdatedProduct,
        files: { photo: null },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await updateProductController(req, res);

      expect(mockSave).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Product Updated Successfully",
        products: mockUpdatedProductResponse,
      });
    });

    it("Raises an error when an exception occurs from updating a product", async () => {
      const mockError = new Error(
        "Something went wrong when creating the product"
      );
      const mockProductId = "67bac8f8c3398a1d89886761";

      const mockUpdatedProduct = {
        name: "Updated Product",
        description: "This is an updated product",
        price: 70,
        category: "67babe1aeae58eb5646d28fb",
        quantity: 2,
        shipping: true,
      };

      const mockPhoto = {
        path: "updated-photo-path",
        size: 350,
        type: "image/png",
      };

      productModel.findByIdAndUpdate = jest.fn().mockRejectedValue(mockError);

      const req = {
        params: { pid: mockProductId },
        fields: mockUpdatedProduct,
        files: { photo: mockPhoto },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await updateProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: mockError,
        message: "Error in Update product",
      });
    });

    it("Does not update product if the name is missing", async () => {
      const mockProductId = "67bac8f8c3398a1d89886761";

      const mockUpdatedProduct = {
        description: "This is an updated product without a name",
        price: 100,
        category: "67babe1aeae58eb5646d28fb",
        quantity: 20,
        shipping: false,
      };

      const mockPhoto = {
        path: "updated-photo-path",
        size: 1000,
        type: "image/jpeg",
      };

      const req = {
        params: { pid: mockProductId },
        fields: mockUpdatedProduct,
        files: { photo: mockPhoto },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await updateProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        error: "Name is Required",
      });
    });

    it("Does not update product if the description is missing", async () => {
      const mockProductId = "67bac8f8c3398a1d89886761";

      const mockUpdatedProduct = {
        name: "Updated Product without description",
        price: 400,
        category: "67babe1aeae58eb5646d28fb",
        quantity: 10,
        shipping: false,
      };

      const mockPhoto = {
        path: "updated-photo-path",
        size: 1000,
        type: "image/png",
      };

      const req = {
        params: { pid: mockProductId },
        fields: mockUpdatedProduct,
        files: { photo: mockPhoto },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await updateProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        error: "Description is Required",
      });
    });

    it("Does not update product if the category is missing", async () => {
      const mockProductId = "67bacb09f1cbaafe09c69512";

      const mockUpdatedProduct = {
        name: "Updated Product without price",
        description: "This is an updated product without a price",
        price: 150,
        quantity: 3,
        shipping: false,
      };

      const mockPhoto = {
        path: "updated-photo-path",
        size: 250,
        type: "image/png",
      };

      const req = {
        params: { pid: mockProductId },
        fields: mockUpdatedProduct,
        files: { photo: mockPhoto },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await updateProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        error: "Category is Required",
      });
    });

    it("Does not update product if the price is missing", async () => {
      const mockProductId = "67bac8f8c3398a1d89886761";

      const mockUpdatedProduct = {
        name: "Updated Product without price",
        description: "This is an updated product without a price",
        category: "67babe1aeae58eb5646d28fb",
        quantity: 3,
        shipping: false,
      };

      const mockPhoto = {
        path: "updated-photo-path",
        size: 250,
        type: "image/png",
      };

      const req = {
        params: { pid: mockProductId },
        fields: mockUpdatedProduct,
        files: { photo: mockPhoto },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await updateProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        error: "Price is Required",
      });
    });

    it("Does not update product if the quantity is missing", async () => {
      const mockProductId = "67bac8f8c3398a1d89886761";

      const mockUpdatedProduct = {
        name: "Updated Product without quantity",
        description: "This is an updated product without a quantity",
        category: "67babe1aeae58eb5646d28fb",
        price: 500,
        shipping: false,
      };

      const mockPhoto = {
        path: "updated-photo-path",
        size: 250,
        type: "image/png",
      };

      const req = {
        params: { pid: mockProductId },
        fields: mockUpdatedProduct,
        files: { photo: mockPhoto },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await updateProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        error: "Quantity is Required",
      });
    });

    it("Updates a product if the photo's size is equal to the 1mb size limit and all other necessary details are present", async () => {
      jest
        .spyOn(fs, "readFileSync")
        .mockReturnValue(Buffer.from("mock-file-data"));

      const mockProductId = "67bac8f8c3398a1d89886761";
      const mockSlug = "updated-product";

      const mockUpdatedProduct = {
        name: "Updated Product",
        description: "This is an updated product",
        price: 100,
        category: "67babe1aeae58eb5646d28fb",
        quantity: 10,
        shipping: true,
      };

      const mockPhoto = {
        path: "updated-photo-path",
        size: 1000000,
        type: "image/jpeg",
      };

      const mockUpdatedProductResponse = {
        ...mockUpdatedProduct,
        _id: mockProductId,
        slug: mockSlug,
        photo: {
          data: "mockPhotoData",
          contentType: mockPhoto.type,
        },
      };

      productModel.findByIdAndUpdate = jest
        .fn()
        .mockResolvedValue(mockUpdatedProductResponse);

      const mockSave = jest.fn().mockResolvedValue(mockUpdatedProductResponse);
      mockUpdatedProductResponse.save = mockSave;

      const req = {
        params: { pid: mockProductId },
        fields: mockUpdatedProduct,
        files: { photo: mockPhoto },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await updateProductController(req, res);

      expect(fs.readFileSync).toHaveBeenCalledWith(mockPhoto.path);
      expect(mockSave).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Product Updated Successfully",
        products: mockUpdatedProductResponse,
      });
    });

    it("Does not update product if photo's size just exceeds the 1mb size limit", async () => {
      const mockProductId = "67bac8f8c3398a1d89886761";

      const mockUpdatedProduct = {
        name: "Updated Product with large photo",
        description:
          "This is an updated product with a photo that just exceeds the size limit",
        price: 100,
        category: "67babe1aeae58eb5646d28fb",
        quantity: 15,
        shipping: false,
      };

      const mockPhoto = {
        path: "updated-photo-path",
        size: 1000001,
        type: "image/jpeg",
      };

      const req = {
        params: { pid: mockProductId },
        fields: mockUpdatedProduct,
        files: { photo: mockPhoto },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await updateProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        error: "Photo is Required and should be less then 1mb",
      });
    });

    it("Does not update product if photo's size exceeds the 1mb size limit by a lot", async () => {
      const mockProductId = "67bac8f8c3398a1d89886761";

      const mockUpdatedProduct = {
        name: "Updated Product with very large photo",
        description:
          "This is an updated product with a photo that exceeds the size limit by a lot",
        price: 100,
        category: "67babe1aeae58eb5646d28fb",
        quantity: 10,
        shipping: true,
      };

      const mockPhoto = {
        path: "updated-photo-path",
        size: 2000000,
        type: "image/jpeg",
      };

      const req = {
        params: { pid: mockProductId },
        fields: mockUpdatedProduct,
        files: { photo: mockPhoto },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await updateProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        error: "Photo is Required and should be less then 1mb",
      });
    });
  });

  describe("Product Filters Controller", () => {
    it("Returns all the products if no filter is applied", async () => {
      const mockProducts = [
        {
          _id: "67bb31d1ad3c5c8736b1c1ea",
          name: "Product 1",
          category: "67bb31e722a241a2f70d3f71",
          price: 10,
        },
        {
          _id: "67bb31d9da82b5bbf3c5aac1",
          name: "Product 2",
          category: "67bb31efa78f89d1d58fcbc2",
          price: 20,
        },
      ];

      productModel.find = jest.fn().mockResolvedValue(mockProducts);

      const req = {
        body: {
          checked: [],
          radio: [],
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await productFiltersController(req, res);

      expect(productModel.find).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: mockProducts,
      });
    });

    it("Should filter products by category when category filter is provided", async () => {
      const mockProducts = [
        {
          _id: "67bb31d1ad3c5c8736b1c1ea",
          name: "Product 1",
          category: "67bb31e722a241a2f70d3f71",
          price: 10,
        },
        {
          _id: "67bb31d9da82b5bbf3c5aac1",
          name: "Product 2",
          category: "67bb31efa78f89d1d58fcbc2",
          price: 20,
        },
      ];

      productModel.find = productModel.find = jest
        .fn()
        .mockImplementation((args) => {
          if (
            args.category &&
            args.category.includes("67bb31e722a241a2f70d3f71")
          ) {
            return Promise.resolve([mockProducts[0]]);
          }
          return Promise.resolve(mockProducts);
        });

      const req = {
        body: {
          checked: ["67bb31e722a241a2f70d3f71"],
          radio: [],
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await productFiltersController(req, res);

      expect(productModel.find).toHaveBeenCalledWith({
        category: ["67bb31e722a241a2f70d3f71"],
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: [mockProducts[0]],
      });
    });

    it("Filters products by price when price filter is provided", async () => {
      const mockProducts = [
        {
          _id: "67bb31d1ad3c5c8736b1c1ea",
          name: "Product 1",
          category: "67bb31e722a241a2f70d3f71",
          price: 10,
        },
        {
          _id: "67bb31d9da82b5bbf3c5aac1",
          name: "Product 2",
          category: "67bb31efa78f89d1d58fcbc2",
          price: 20,
        },
        {
          _id: "67bb34952d4dab6b1d9c0f26",
          name: "Product 3",
          category: "67bb349d23f5d1756afd258e",
          price: 50,
        },
      ];

      productModel.find = productModel.find = jest
        .fn()
        .mockImplementation((args) => {
          if (args) {
            const { $gte, $lte } = args.price;
            const filteredProducts = mockProducts.filter(
              (product) => product.price >= $gte && product.price <= $lte
            );
            return Promise.resolve(filteredProducts);
          }

          return Promise.resolve(mockProducts);
        });

      const req = {
        body: {
          checked: [],
          radio: [0, 20],
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await productFiltersController(req, res);

      expect(productModel.find).toHaveBeenCalledWith({
        price: {
          $gte: 0,
          $lte: 20,
        },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: [
          {
            _id: "67bb31d1ad3c5c8736b1c1ea",
            name: "Product 1",
            category: "67bb31e722a241a2f70d3f71",
            price: 10,
          },
          {
            _id: "67bb31d9da82b5bbf3c5aac1",
            name: "Product 2",
            category: "67bb31efa78f89d1d58fcbc2",
            price: 20,
          },
        ],
      });
    });

    it("Filters products by both category and price when check and radio are provided", async () => {
      const mockProducts = [
        {
          _id: "67bb31d1ad3c5c8736b1c1ea",
          name: "Product 1",
          category: "67bb31e722a241a2f70d3f71",
          price: 10,
        },
        {
          _id: "67bb31d9da82b5bbf3c5aac1",
          name: "Product 2",
          category: "67bb31efa78f89d1d58fcbc2",
          price: 20,
        },
        {
          _id: "67bb34952d4dab6b1d9c0f26",
          name: "Product 3",
          category: "67bb31e722a241a2f70d3f71",
          price: 50,
        },
      ];

      productModel.find = jest.fn().mockImplementation((args) => {
        let currProducts = mockProducts;

        if (args) {
          if (
            args.category &&
            args.category.includes("67bb31e722a241a2f70d3f71")
          ) {
            currProducts = currProducts.filter(
              (product) => product.category === "67bb31e722a241a2f70d3f71"
            );
          }

          if (args.price) {
            const { $gte, $lte } = args.price;
            currProducts = currProducts.filter(
              (product) => product.price >= $gte && product.price <= $lte
            );
          }
        }
        return Promise.resolve(currProducts);
      });

      const req = {
        body: {
          checked: ["67bb31e722a241a2f70d3f71"],
          radio: [0, 20],
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await productFiltersController(req, res);

      expect(productModel.find).toHaveBeenCalledWith({
        category: ["67bb31e722a241a2f70d3f71"],
        price: {
          $gte: 0,
          $lte: 20,
        },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: [
          {
            _id: "67bb31d1ad3c5c8736b1c1ea",
            name: "Product 1",
            category: "67bb31e722a241a2f70d3f71",
            price: 10,
          },
        ],
      });
    });

    it("Returns an error when an exception is raised from filtering the products", async () => {
      const mockError = new Error(
        "Something went wrong when filtering the products"
      );

      productModel.find = jest.fn().mockRejectedValue(mockError);

      const req = {
        body: {
          checked: [],
          radio: [],
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await productFiltersController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error While Filtering Products",
        error: mockError,
      });
    });
  });

  describe("Get product controller", () => {
    it("Returns a list of all the products", async () => {
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
      const mockError = new Error("Something went wrong with the database");

      productModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockRejectedValue(mockError),
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
      const mockProduct = {
        name: "Single Product",
        description: "This is a single product",
      };

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
      const mockError = new Error("Something went wrong with the database");

      productModel.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockRejectedValue(mockError),
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

  describe("Delete product controller", () => {
    it("Deletes a single product", async () => {
      const mockProduct = {
        _id: "67b8d6e11400470837227a34",
        name: "Test Product",
        price: 50,
      };

      productModel.findByIdAndDelete = jest.fn().mockImplementation(() => ({
        select: jest.fn().mockResolvedValue(mockProduct),
      }));

      const req = { params: { pid: "67b8d6e11400470837227a34" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await deleteProductController(req, res);

      expect(productModel.findByIdAndDelete).toHaveBeenCalledWith(
        "67b8d6e11400470837227a34"
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Product Deleted successfully",
      });
    });

    it("Raises an error when an exception occurs from deleting the product", async () => {
      const mockError = new Error("Could not delete product");

      productModel.findByIdAndDelete = jest.fn().mockImplementation(() => ({
        select: jest.fn().mockRejectedValue(mockError),
      }));

      const req = { params: { pid: "67b8ede47f8111e1ce491e93" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await deleteProductController(req, res);

      expect(productModel.findByIdAndDelete).toHaveBeenCalledWith(
        "67b8ede47f8111e1ce491e93"
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error while deleting product",
        error: mockError,
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

    it("Raises an error if the product photo does not exist", async () => {
      const mockProduct = {
        photo: {
          data: null,
          contentType: null,
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

      expect(productModel.findById).toHaveBeenCalledWith(req.params.pid);
      expect(productModel.findById().select).toHaveBeenCalledWith("photo");
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("Returns an error when an exception occurs from fetching the product photo", async () => {
      const mockProduct = {
        photo: null,
      };

      productModel.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockProduct),
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
        error: expect.any(Error),
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
      jest.clearAllMocks();
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

  describe("Product count controller", () => {
    it("Returns the number of products", async () => {
      productModel.find = jest.fn().mockReturnValue({
        estimatedDocumentCount: jest.fn().mockResolvedValue(50),
      });

      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await productCountController(req, res);

      expect(productModel.find).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        total: 50,
      });
    });

    it("Returns an error when an exception occurs from fetching the product count", async () => {
      productModel.find = jest.fn().mockReturnValue({
        estimatedDocumentCount: jest
          .fn()
          .mockRejectedValue(
            new Error("Error occurred from fetching product count")
          ),
      });

      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await productCountController(req, res);

      expect(productModel.find).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        message: "Error in product count",
        error: new Error("Error occurred from fetching product count"),
        success: false,
      });
    });
  });

  describe("Product list controller", () => {
    it("Returns exactly 6 products on the first page", async () => {
      const mockProducts = [
        { name: "Test product 1", description: "First test product" },
        { name: "Test product 2", description: "Second test product" },
        { name: "Test product 3", description: "Test product 3" },
        { name: "Test product 4", description: "Test product 4" },
        { name: "Test product 5", description: "Test product 5" },
        { name: "Test product 6", description: "Test product 6" },
      ];

      productModel.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockProducts),
      });

      const req = { params: { page: 1 } };
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await productListController(req, res);

      expect(productModel.find).toHaveBeenCalledWith({});
      expect(productModel.find().select).toHaveBeenCalledWith("-photo");
      expect(productModel.find().limit).toHaveBeenCalledWith(6);
      expect(productModel.find().skip).toHaveBeenCalledWith(0);
      expect(productModel.find().sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: mockProducts,
      });
    });

    it("Returns fewer than 6 products when there are not enough products", async () => {
      const mockProducts = [
        { name: "Test product 1", description: "First test product" },
        { name: "Test product 2", description: "Second test product" },
        { name: "Test product 3", description: "Test product 3" },
        { name: "Test product 4", description: "Test product 4" },
      ];

      productModel.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockProducts),
      });

      const req = { params: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await productListController(req, res);

      expect(productModel.find).toHaveBeenCalledWith({});
      expect(productModel.find().select).toHaveBeenCalledWith("-photo");
      expect(productModel.find().limit).toHaveBeenCalledWith(6);
      expect(productModel.find().skip).toHaveBeenCalledWith(0);
      expect(productModel.find().sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: mockProducts,
      });
    });

    it("Returns the correct products for the second page when there are more than 6 products", async () => {
      const mockProducts = [
        { name: "Test product 1", description: "Test product 1" },
        { name: "Test product 2", description: "Test product 2" },
        { name: "Test product 3", description: "Test product 3" },
        { name: "Test product 4", description: "Test product 4" },
        { name: "Test product 5", description: "Test product 5" },
        { name: "Test product 6", description: "Test product 6" },
        { name: "Test product 7", description: "Test product 7" },
        { name: "Test product 8", description: "Test product 8" },
      ];

      productModel.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockProducts.slice(6)),
      });

      const req = { params: { page: 2 } };
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await productListController(req, res);

      expect(productModel.find).toHaveBeenCalledWith({});
      expect(productModel.find().select).toHaveBeenCalledWith("-photo");
      expect(productModel.find().limit).toHaveBeenCalledWith(6);
      expect(productModel.find().skip).toHaveBeenCalledWith(6);
      expect(productModel.find().sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: mockProducts.slice(6),
      });
    });

    it("Returns an error when an exception occurs from fetching the products list", async () => {
      const mockError = new Error(
        "Something went wrong when getting the products list"
      );

      productModel.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockRejectedValue(mockError),
      });

      const req = { params: { page: 1 } };

      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await productListController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "error in per page ctrl",
        error: mockError,
      });
    });
  });

  describe("Product category controller", () => {
    it("Returns products from a certain category", async () => {
      const mockCategory = {
        _id: "67bb20976c8350dfa83934a0",
        slug: "test-category",
        name: "Test Category",
      };

      const mockProducts = [
        {
          _id: "67bb20a0db56a21c0c9b7724",
          name: "Product 1",
          category: mockCategory._id,
        },
        {
          _id: "67bb20a9d5f4d506ccceefef",
          name: "Product 2",
          category: mockCategory._id,
        },
      ];

      categoryModel.findOne = jest.fn().mockResolvedValue(mockCategory);

      productModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockProducts),
      });

      const req = { params: { slug: "test-category" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await productCategoryController(req, res);

      expect(categoryModel.findOne).toHaveBeenCalledWith({
        slug: "test-category",
      });
      expect(productModel.find).toHaveBeenCalledWith({
        category: {
          _id: "67bb20976c8350dfa83934a0",
          slug: "test-category",
          name: "Test Category",
        },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        category: mockCategory,
        products: mockProducts,
      });
    });

    it("Returns an error when the category is not found", async () => {
      categoryModel.findOne = jest.fn().mockResolvedValue(null);

      const req = { params: { slug: "category-not-found" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await productCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Category Not Found",
      });
    });

    it("Returns an error when an exception occurs from fetching products by category", async () => {
      const mockCategory = {
        _id: "67bb20976c8350dfa83934a0",
        slug: "test-category",
        name: "Test Category",
      };
      const mockError = new Error(
        "Something went wrong while fetching products by category"
      );

      categoryModel.findOne = jest.fn().mockResolvedValue(mockCategory);

      productModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockRejectedValue(mockError),
      });

      const req = { params: { slug: "test-category" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await productCategoryController(req, res);

      expect(categoryModel.findOne).toHaveBeenCalledWith({
        slug: "test-category",
      });
      expect(productModel.find).toHaveBeenCalledWith({
        category: {
          _id: "67bb20976c8350dfa83934a0",
          slug: "test-category",
          name: "Test Category",
        },
      });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: mockError,
        message: "Error While Getting products",
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

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        clientToken: "mock-braintree-token",
      });
    });

    it("Returns an error when an exception occurs from generating the token", async () => {
      const mockError = new Error("Something went wrong with Braintree");

      jest.spyOn(braintree, "BraintreeGateway").mockImplementation(() => ({
        clientToken: {
          generate: (_, callback) => callback(mockError, null),
        },
      }));

      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await braintreeTokenController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(mockError);
    });
  });

  describe("BrainTree payment controller", () => {
    it("Creates a Braintree transaction with the correct amount and nonce", async () => {
      jest.spyOn(braintree, "BraintreeGateway").mockImplementation(() => ({
        transaction: {
          sale: (_, callback) =>
            callback(null, {
              amount: 150,
              paymentMethodNonce: "fake-payment-nonce",
            }),
        },
      }));

      const mockSave = jest.fn().mockResolvedValue({});
      jest.spyOn(orderModel.prototype, "save").mockImplementation(mockSave);

      const req = {
        body: {
          nonce: "fake-nonce",
          cart: [
            { _id: "67b6257c91b2a9d1b753c5d4", price: 50 },
            { _id: "67b6259457a811c8986eda71", price: 100 },
          ],
          options: {
            submitForSettlement: true,
          },
        },
        user: {
          _id: "67b6250197ca04df46835aa8",
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
        json: jest.fn(),
      };

      await brainTreePaymentController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ ok: true });

      const productIds = req.body.cart.map(
        (p) => new mongoose.Types.ObjectId(p._id)
      );

      expect(mockSave).toHaveBeenCalled();
      const savedOrder = mockSave.mock.instances[0];
      expect(savedOrder.products).toEqual(productIds);
      expect(savedOrder.payment).toEqual({
        amount: 150,
        paymentMethodNonce: "fake-payment-nonce",
      });
      expect(savedOrder.buyer).toEqual(
        new mongoose.Types.ObjectId(req.user._id)
      );
      expect(savedOrder.status).toEqual("Not Processed");
    });

    it("Returns an error if an exception occurs inside the Braintree transaction", async () => {
      jest.spyOn(braintree, "BraintreeGateway").mockImplementation(() => ({
        transaction: {
          sale: (_, callback) =>
            callback(new Error("Braintree transaction failed"), null),
        },
      }));

      const req = {
        body: {
          nonce: "fake-nonce",
          cart: [
            { _id: "67b6257c91b2a9d1b753c5d4", price: 20 },
            { _id: "67b6259457a811c8986eda71", price: 25 },
          ],
          options: {
            submitForSettlement: true,
          },
        },
        user: {
          _id: "67b6250197ca04df46835aa8",
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
        json: jest.fn(),
      };

      await brainTreePaymentController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(expect.any(Error));
    });

    it("Returns an error if an exception occurs outside the Braintree transaction", async () => {
      const mockError = new Error("Failed to initialise Braintree Gateway");

      jest.spyOn(braintree, "BraintreeGateway").mockImplementation(() => {
        throw mockError;
      });

      const req = {
        body: {
          nonce: "fake-nonce",
          cart: [
            { _id: "67b6257c91b2a9d1b753c5d4", price: 20 },
            { _id: "67b6259457a811c8986eda71", price: 25 },
          ],
          options: {
            submitForSettlement: true,
          },
        },
        user: {
          _id: "67b6250197ca04df46835aa8",
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await brainTreePaymentController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        ok: false,
        message: "Error outside Braintree transaction",
        error: mockError,
      });
    });
  });
});
