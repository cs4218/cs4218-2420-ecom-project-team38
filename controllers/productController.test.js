import { describe, jest } from "@jest/globals";
import mongoose from "mongoose";
import braintree from "braintree";
import fs from "fs";
import * as slugify from "slugify";
import {
  createProductController,
  updateProductController,
  getProductController,
  getSingleProductController,
  deleteProductController,
  productPhotoController,
  relatedProductController,
  searchProductController,
  braintreeTokenController,
  brainTreePaymentController
} from "../controllers/productController";
import productModel from "../models/productModel";
import orderModel from "../models/orderModel";
import { error } from "console";

jest.mock("../models/productModel");
jest.mock("../models/orderModel");

describe("Product controller", () => {
  describe("Create product controller", () => {
    it("Creates a new product if all necessary details are given and within the limit ", async () => {
      jest.spyOn(fs, 'readFileSync').mockReturnValue(Buffer.from('mock-file-data'));

      const mockSlug = "test-product";
  
      const mockProduct = {
        _id: "67b98fd0235fa3cf8e4bbe72",
        name: "test product",
        description: "This is a test product",
        price: 50,
        category: "67b9927c50c661ec1f06c2fc",
        quantity: 1,
        shipping: true
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
  
      jest.spyOn(productModel.prototype, 'save').mockImplementation(mockSave);
  
      const req = {
        fields: { ...mockProduct },
        files: { photo: mockPhoto }
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
      expect(Buffer.from(sentProduct.photo.data).toString()).toBe(Buffer.from('mock-file-data').toString());
    });

    it("Does not create a product if the name is missing", async () => {
      const mockProduct = {
        _id: "67ba0da9a6aac64d80e7a1c1",
        description: "This is a test product without a name",
        price: 50,
        category: "67ba0db37d0621608b2f79e2",
        quantity: 1,
        shipping: true
      };

      const req = {
        fields: { ...mockProduct },
        files: { photo: { path: "mock-photo-path", type: "image/png", size: 100 } }
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
        shipping: false
      };

      const req = {
        fields: { ...mockProduct },
        files: { photo: { path: "mock-photo-path", type: "image/png", size: 200 } }
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
        shipping: true
      };

      const req = {
        fields: { ...mockProduct },
        files: { photo: { path: "mock-photo-path", type: "image/png", size: 200 } }
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
        shipping: false
      };

      const req = {
        fields: { ...mockProduct },
        files: { photo: { path: "mock-photo-path", type: "image/jpg", size: 200 } }
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
        shipping: false
      };

      const req = {
        fields: { ...mockProduct },
        files: { photo: { path: "mock-photo-path", type: "image/jpg", size: 700 } }
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
      jest.spyOn(fs, 'readFileSync').mockReturnValue(Buffer.from('mock-file-data'));

      const mockSlug = "test-product";
  
      const mockProduct = {
        _id: "67b98fd0235fa3cf8e4bbe72",
        name: "test product",
        description: "This is a test product",
        price: 25,
        category: "67b9927c50c661ec1f06c2fc",
        quantity: 30,
        shipping: true
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
  
      jest.spyOn(productModel.prototype, 'save').mockImplementation(mockSave);
  
      const req = {
        fields: { ...mockProduct },
        files: { photo: mockPhoto }
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
      expect(Buffer.from(sentProduct.photo.data).toString()).toBe(Buffer.from('mock-file-data').toString());
    });

    it("Does not create a product if the photo's size just exceeds the 1mb size limit", async () => {
      const mockProduct = {
        _id: "67ba0e19b5b64a493c0f08aa",
        name: "test product without category",
        description: "This is a test product with a photo that is too large in size",
        price: 60,
        category: "67ba0db37d0621608b2f79e2",
        quantity: 5,
        shipping: false
      };

      const req = {
        fields: { ...mockProduct },
        files: { photo: { path: "mock-photo-path", type: "image/jpg", size: 1000001 }}
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
        description: "This is a test product with a photo that is too large in size",
        price: 60,
        category: "67ba0db37d0621608b2f79e2",
        quantity: 5,
        shipping: false
      };

      const req = {
        fields: { ...mockProduct },
        files: { photo: { path: "mock-photo-path", type: "image/jpg", size: 2000000 }}
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
      jest.spyOn(fs, 'readFileSync').mockReturnValue(Buffer.from('mock-file-data'));

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
        size: 2000,
        type: "image/jpeg",
      };

      const mockUpdatedProductResponse = {
        ...mockUpdatedProduct,
        _id: mockProductId,
        slug: mockSlug,
        photo: { 
          data: "mockPhotoData", 
          contentType: mockPhoto.type 
        },
      };

      productModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUpdatedProductResponse);

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
      jest.spyOn(fs, 'readFileSync').mockReturnValue(Buffer.from('mock-file-data'));

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
          contentType: mockPhoto.type 
        },
      };

      productModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUpdatedProductResponse);

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
        description: "This is an updated product with a photo that just exceeds the size limit",
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
        description: "This is an updated product with a photo that exceeds the size limit by a lot",
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
  })

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
      const mockError = new Error("Something went wrong with the database");

      productModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest
          .fn()
          .mockRejectedValue(
            mockError
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
      const mockProduct = { 
        name: "Single Product", 
        description: "This is a single product" 
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
        populate: jest
          .fn()
          .mockRejectedValue(
            mockError
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

  describe("Delete product controller", () => {
    it("Deletes a single product", async () => {
      const mockProduct = {
        _id: "67b8d6e11400470837227a34",
        name: "Test Product",
        price: 50,
      };
    
      productModel.findByIdAndDelete = jest.fn().mockImplementation(() => ({
        select: jest.fn().mockResolvedValue(mockProduct),
      }))
  
      const req = { params: { pid: "67b8d6e11400470837227a34" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
  
      await deleteProductController(req, res);

      expect(productModel.findByIdAndDelete).toHaveBeenCalledWith("67b8d6e11400470837227a34");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Product Deleted successfully",
      });
    })

    it("Raises an error when an exception occurs from deleting the product", async () => {
      const mockError = new Error("Could not delete product");

      productModel.findByIdAndDelete = jest.fn().mockImplementation(() => ({
        select: jest.fn().mockRejectedValue(mockError),
      }))
  
      const req = { params: { pid: "67b8ede47f8111e1ce491e93" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
  
      await deleteProductController(req, res);

      expect(productModel.findByIdAndDelete).toHaveBeenCalledWith("67b8ede47f8111e1ce491e93");
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error while deleting product",
        error: mockError,
      });
    })
  })

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
      const mockError = new Error("Something went wrong while fetching the photo");

      productModel.findById = jest.fn().mockReturnValue({
        select: jest
          .fn()
          .mockRejectedValue(
            mockError
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
 
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({ clientToken: "mock-braintree-token" });
    })

    it("Returns an error when an exception occurs from generating the token", async () => {
      const mockError = new Error("Something went wrong with Braintree");

      jest.spyOn(braintree, "BraintreeGateway").mockImplementation(() => ({
        clientToken: {
          generate: (_, callback) =>
            callback(mockError, null),
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
    })
  })

  describe("BrainTree payment controller", () => {
    it("Creates a Braintree transaction with the correct amount and nonce", async () => {
      jest.spyOn(braintree, "BraintreeGateway").mockImplementation(() => ({
        transaction: {
          sale: (_, callback) => callback(null, { amount: 150, paymentMethodNonce: "fake-payment-nonce" }),
        },
      }));

      const mockSave = jest.fn().mockResolvedValue({});
      jest.spyOn(orderModel.prototype, 'save').mockImplementation(mockSave);

      const req = {
        body: {
          nonce: 'fake-nonce',
          cart: [
            { _id: "67b6257c91b2a9d1b753c5d4", price: 50 },
            { _id: "67b6259457a811c8986eda71", price: 100 },
          ],
          options: {
            submitForSettlement: true,
          },
        },
        user: {
          _id: '67b6250197ca04df46835aa8',
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

      const productIds = req.body.cart.map(p => new mongoose.Types.ObjectId(p._id));

      expect(mockSave).toHaveBeenCalled();
      const savedOrder = mockSave.mock.instances[0];
      expect(savedOrder.products).toEqual(productIds);
      expect(savedOrder.payment).toEqual({ amount: 150, paymentMethodNonce: "fake-payment-nonce" });
      expect(savedOrder.buyer).toEqual(new mongoose.Types.ObjectId(req.user._id));
      expect(savedOrder.status).toEqual("Not Process");
    })
  })
});
