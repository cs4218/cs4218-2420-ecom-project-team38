import Express from "express";
import JWT from "jsonwebtoken";
import productRoutes from "./productRoutes";
import request from "supertest";
import userModel from "../models/userModel";
import productModel from "../models/productModel";
import categoryModel from "../models/categoryModel";
import orderModel from "../models/orderModel";
import mongoose from "mongoose";
import { beforeAll, afterAll, expect } from "@jest/globals";
import { MongoMemoryServer } from "mongodb-memory-server";

const app = Express();
app.use(Express.json());
app.use("/api/v1/product", productRoutes);

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();

  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }

  const mongoUri = mongo.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe("Product Routes", () => {
  describe("POST /api/v1/product/create-product", () => {
    it("Should create a new product when the user is authenticated and is also an admin", async () => {
      const adminUser = await userModel.create({
        name: "Admin User",
        email: "admin@example.com",
        password: "password",
        phone: "1234567890",
        address: {
          street: "Jurong East Street 21",
          city: "Singapore",
          zip: "123456",
        },
        answer: "answer",
        DOB: new Date("2000-01-01"),
        role: 1,
      });

      const token = JWT.sign({ _id: adminUser._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      const response = await request(app)
        .post("/api/v1/product/create-product")
        .set("Authorization", `${token}`)
        .field("name", "new product")
        .field("description", "new product description")
        .field("price", 1000)
        .field("category", "67d30c089053b3cfffe5de9e")
        .field("quantity", 10);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Product Created Successfully"
      );
      expect(response.body).toHaveProperty("products");

      const { products } = response.body;
      expect(products).toHaveProperty("name", "new product");
      expect(products).toHaveProperty("slug", "new-product");
      expect(products).toHaveProperty("description", "new product description");
      expect(products).toHaveProperty("price", 1000);
      expect(products).toHaveProperty("category");
      expect(products).toHaveProperty("quantity", 10);

      await userModel.findByIdAndDelete(adminUser._id);
    });

    it("Should not create a new product when user is not authenticated", async () => {
      const response = await request(app)
        .post("/api/v1/product/create-product")
        .field("name", "updated book")
        .field("description", "updated book description")
        .field("price", 20)
        .field("category", "67d18a47b92dddc71c78f644")
        .field("quantity", 25);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "Unauthorized Access");
      expect(response.body).toHaveProperty("error");

      const { error } = response.body;
      expect(error).toHaveProperty("name", "JsonWebTokenError");
      expect(error).toHaveProperty("message", "jwt must be provided");
    });

    it("Should not create a new product if user is not an admin", async () => {
      const normalUser = await userModel.create({
        name: "Normal User",
        email: "user@example.com",
        password: "password",
        phone: "1234567890",
        address: {
          street: "Jurong West Street 21",
          city: "Singapore",
          zip: "123456",
        },
        answer: "idk",
        DOB: new Date("2000-02-02"),
        role: 0,
      });

      const token = JWT.sign({ _id: normalUser._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      const response = await request(app)
        .post("/api/v1/product/create-product")
        .set("Authorization", `${token}`)
        .field("name", "new product")
        .field("description", "new product description")
        .field("price", 1000)
        .field("category", "67d30c089053b3cfffe5de9e")
        .field("quantity", 10);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "Unauthorized Access");

      await userModel.findByIdAndDelete(normalUser._id);
    });
  });

  describe("PUT /api/v1/product/update-product", () => {
    let adminUser, adminToken, normalUser, normalToken, pid;

    beforeEach(async () => {
      await userModel.deleteMany({});
      await productModel.deleteMany({});

      adminUser = await userModel.create({
        name: "Admin User",
        email: "admin@example.com",
        password: "password",
        phone: "1234567890",
        address: {
          street: "Jurong East Street 21",
          city: "Singapore",
          zip: "123456",
        },
        answer: "answer",
        DOB: new Date("2000-01-01"),
        role: 1,
      });

      adminToken = JWT.sign({ _id: adminUser._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      normalUser = await userModel.create({
        name: "Normal User",
        email: "user@example.com",
        password: "password",
        phone: "1234567890",
        address: {
          street: "Jurong West Street 21",
          city: "Singapore",
          zip: "123456",
        },
        answer: "idk",
        DOB: new Date("2000-02-02"),
        role: 0,
      });

      normalToken = JWT.sign({ _id: normalUser._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      const product = await productModel.create({
        name: "book",
        slug: "book",
        description: "book description",
        price: 10,
        category: new mongoose.Types.ObjectId("67d18a47b92dddc71c78f644"),
        quantity: 20,
      });

      pid = product._id;
    });

    it("Should update a product if the user is authenticated and is also an admin", async () => {
      const response = await request(app)
        .put(`/api/v1/product/update-product/${pid}`)
        .set("Authorization", `${adminToken}`)
        .field("name", "updated book")
        .field("description", "updated book description")
        .field("price", 20)
        .field("category", "67d18a47b92dddc71c78f644")
        .field("quantity", 25);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Product Updated Successfully"
      );
      expect(response.body).toHaveProperty("products");

      const { products } = response.body;
      expect(products).toHaveProperty("name", "updated book");
      expect(products).toHaveProperty("slug", "updated-book");
      expect(products).toHaveProperty(
        "description",
        "updated book description"
      );
      expect(products).toHaveProperty("price", 20);
      expect(products).toHaveProperty("category");
      expect(products).toHaveProperty("quantity", 25);
    });

    it("Should not update a product if user is not authenticated", async () => {
      const response = await request(app)
        .put(`/api/v1/product/update-product/${pid}`)
        .field("name", "updated book")
        .field("description", "updated book description")
        .field("price", 20)
        .field("category", "67d18a47b92dddc71c78f644")
        .field("quantity", 25);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "Unauthorized Access");
      expect(response.body).toHaveProperty("error");

      const { error } = response.body;
      expect(error).toHaveProperty("name", "JsonWebTokenError");
      expect(error).toHaveProperty("message", "jwt must be provided");
    });

    it("Should not update a product if user is not an admin", async () => {
      const response = await request(app)
        .put(`/api/v1/product/update-product/${pid}`)
        .set("Authorization", `${normalToken}`)
        .field("name", "updated book")
        .field("description", "updated book description")
        .field("price", 20)
        .field("category", "67d18a47b92dddc71c78f644")
        .field("quantity", 25);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "Unauthorized Access");
    });
  });

  describe("DELETE /api/v1/product/delete-product", () => {
    let pid, token, adminToken, normalToken;

    beforeEach(async () => {
      await productModel.deleteMany({});
      await userModel.deleteMany({});

      const product = await productModel.create({
        name: "book",
        slug: "book",
        description: "book description",
        price: 10,
        category: new mongoose.Types.ObjectId("67d18a47b92dddc71c78f644"),
        quantity: 20,
      });

      pid = product._id;

      const adminUser = await userModel.create({
        name: "Admin User",
        email: "admin@example.com",
        password: "password",
        phone: "1234567890",
        address: {
          street: "Jurong East Street 21",
          city: "Singapore",
          zip: "123456",
        },
        answer: "answer",
        DOB: new Date("2000-01-01"),
        role: 1,
      });

      adminToken = JWT.sign({ _id: adminUser._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      const normalUser = await userModel.create({
        name: "Normal User",
        email: "user@example.com",
        password: "password",
        phone: "1234567890",
        address: {
          street: "Jurong West Street 21",
          city: "Singapore",
          zip: "123456",
        },
        answer: "idk",
        DOB: new Date("2000-02-02"),
        role: 0,
      });

      normalToken = JWT.sign({ _id: normalUser._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });
    });

    it("Should delete a product if the user is authenticated and is also an admin", async () => {
      token = adminToken;
      const response = await request(app)
        .delete(`/api/v1/product/delete-product/${pid}`)
        .set("Authorization", `${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Product Deleted successfully"
      );
    });

    it("Should delete a product if the user is not an admin", async () => {
      token = normalToken;
      const response = await request(app)
        .delete(`/api/v1/product/delete-product/${pid}`)
        .set("Authorization", `${token}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "Unauthorized Access");
    });

    it("Should not delete a product if the user is not authenticated", async () => {
      const response = await request(app).delete(
        `/api/v1/product/delete-product/${pid}`
      );

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "Unauthorized Access");
    });

    it("Should not delete anything if the product does not exist", async () => {
      token = adminToken;
      const fakePid = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/v1/product/delete-product/${fakePid}`)
        .set("Authorization", `${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Product Deleted successfully"
      );
    });
  });

  describe("GET /api/v1/product/search", () => {
    const products = [
      {
        name: "phone",
        slug: "phone",
        description: "phone description",
        price: 1000,
        category: new mongoose.Types.ObjectId("66db427fdb0119d9234b27ee"),
        quantity: 10,
      },
      {
        name: "laptop",
        slug: "laptop",
        description: "laptop description",
        price: 2000,
        category: new mongoose.Types.ObjectId("66db427fdb0119d9234b27ee"),
        quantity: 20,
      },
    ];
    beforeEach(async () => {
      await productModel.deleteMany({});
      await productModel.create(products);
    });

    it("Should return a list of products with names matching the keyword", async () => {
      const keyword = products[0].name;
      const response = await request(app).get(
        `/api/v1/product/search/${keyword}`
      );
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty("name", products[0].name);
      expect(response.body[0]).toHaveProperty("slug", products[0].slug);
      expect(response.body[0]).toHaveProperty(
        "description",
        products[0].description
      );
      expect(response.body[0]).toHaveProperty("price", products[0].price);
      expect(response.body[0]).toHaveProperty(
        "category",
        products[0].category.toString()
      );
      expect(response.body[0]).toHaveProperty("quantity", products[0].quantity);
    });

    it("Should return a list of products with descriptions matching the keyword", async () => {
      const keyword = "description";
      const response = await request(app).get(
        `/api/v1/product/search/${keyword}`
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body.map((p) => p.name));
      expect(response.body.map((p) => p.slug)).toEqual(
        expect.arrayContaining([products[0].slug, products[1].slug])
      );
      expect(response.body.map((p) => p.description)).toEqual(
        expect.arrayContaining([
          products[0].description,
          products[1].description,
        ])
      );
      expect(response.body.map((p) => p.price)).toEqual(
        expect.arrayContaining([products[0].price, products[1].price])
      );
      expect(response.body.map((p) => p.category)).toEqual(
        expect.arrayContaining([
          products[0].category.toString(),
          products[1].category.toString(),
        ])
      );
      expect(response.body.map((p) => p.quantity)).toEqual(
        expect.arrayContaining([products[0].quantity, products[1].quantity])
      );
    });

    it("Should return an empty list when keyword does not match products", async () => {
      const keyword = "non-existent";
      const response = await request(app).get(
        `/api/v1/product/search/${keyword}`
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe("GET /api/v1/product/get-product", () => {
    beforeEach(async () => {
      await productModel.deleteMany({});
      await productModel.create([
        {
          name: "book",
          slug: "book",
          description: "book description",
          price: 10,
          category: new mongoose.Types.ObjectId("67d18a47b92dddc71c78f644"),
          quantity: 20,
        },
        {
          name: "laptop",
          slug: "laptop",
          description: "laptop description",
          price: 2000,
          category: new mongoose.Types.ObjectId("67d18a5fe08b3e56cc31552c"),
          quantity: 25,
        },
      ]);
    });

    it("Should return a list of all products when no slug is provided", async () => {
      const response = await request(app).get("/api/v1/product/get-product");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("products");
      expect(response.body.products).toHaveLength(2);

      const { products } = response.body;
      products.sort((a, b) => a.name.localeCompare(b.name));
      expect(products[0]).toHaveProperty("name", "book");
      expect(products[0]).toHaveProperty("slug", "book");

      expect(products[1]).toHaveProperty("name", "laptop");
      expect(products[1]).toHaveProperty("slug", "laptop");
    });

    it("Should return product with the given slug", async () => {
      const slug = "book";
      const response = await request(app).get(
        `/api/v1/product/get-product/${slug}`
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message", "Single Product Fetched");
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("product");

      const { product } = response.body;

      expect(product).toHaveProperty("name", "book");
      expect(product).toHaveProperty("slug", "book");
      expect(product).toHaveProperty("description", "book description");
      expect(product).toHaveProperty("price", 10);
      expect(product).toHaveProperty("category");
      expect(product).toHaveProperty("quantity", 20);
    });

    it("Should return no product when slug does not exist", async () => {
      const slug = "camera";
      const response = await request(app).get(
        `/api/v1/product/get-product/${slug}`
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message", "Single Product Fetched");
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("product");

      const { product } = response.body;
      expect(product).toBeNull();
    });
  });

  describe("GET /api/v1/product-filters", () => {
    beforeEach(async () => {
      await productModel.deleteMany({});
      await productModel.create([
        {
          name: "book",
          slug: "book",
          description: "book description",
          price: 10,
          category: new mongoose.Types.ObjectId("67d18a47b92dddc71c78f644"),
          quantity: 20,
        },
        {
          name: "laptop",
          slug: "laptop",
          description: "laptop description",
          price: 2000,
          category: new mongoose.Types.ObjectId("67d18a5fe08b3e56cc31552c"),
          quantity: 25,
        },
      ]);
    });

    it("Should return a list of products based on the filters", async () => {
      const filters = {
        checked: ["67d18a47b92dddc71c78f644"],
        radio: [5, 15],
      };

      const response = await request(app)
        .post("/api/v1/product/product-filters")
        .set("Content-Type", "application/json")
        .send(filters);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("products");
      expect(response.body.products).toHaveLength(1);

      const { products } = response.body;
      expect(products[0]).toHaveProperty("name", "book");
      expect(products[0]).toHaveProperty("slug", "book");
      expect(products[0]).toHaveProperty("description", "book description");
      expect(products[0]).toHaveProperty("price", 10);
      expect(products[0]).toHaveProperty(
        "category",
        "67d18a47b92dddc71c78f644"
      );
      expect(products[0]).toHaveProperty("quantity", 20);
    });

    it("Should return the whole list of products when no filters are provided", async () => {
      const filters = {
        checked: [],
        radio: [],
      };

      const response = await request(app)
        .post("/api/v1/product/product-filters")
        .set("Content-Type", "application/json")
        .send(filters);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("products");

      const { products } = response.body;
      products.sort((a, b) => a.name.localeCompare(b.name));

      expect(products[0]).toHaveProperty("name", "book");
      expect(products[0]).toHaveProperty("slug", "book");

      expect(products[1]).toHaveProperty("name", "laptop");
      expect(products[1]).toHaveProperty("slug", "laptop");
    });
  });

  describe("GET /api/v1/product/related-product", () => {
    let cid, pid;

    beforeEach(async () => {
      await productModel.deleteMany({});
      await categoryModel.deleteMany({});

      const category = await categoryModel.create({
        name: "Electronics",
        slug: "electronics",
      });
      cid = category._id;

      const products = await productModel.create([
        {
          name: "phone",
          slug: "phone",
          description: "phone description",
          price: 1000,
          category: cid,
          quantity: 10,
        },
        {
          name: "laptop",
          slug: "laptop",
          description: "laptop description",
          price: 2000,
          category: cid,
          quantity: 20,
        },
      ]);

      pid = products[0]._id;
    });

    it("Should return related products", async () => {
      const response = await request(app).get(
        `/api/v1/product/related-product/${pid}/${cid}`
      );
      expect(response.status).toBe(200);

      const { products } = response.body;
      expect(products).toHaveLength(1);
      expect(products[0]).toHaveProperty("name", "laptop");
      expect(products[0]).toHaveProperty("slug", "laptop");
      expect(products[0]).toHaveProperty("description", "laptop description");
      expect(products[0]).toHaveProperty("price", 2000);
      expect(products[0]).toHaveProperty("category");
      expect(products[0]).toHaveProperty("quantity", 20);
    });

    it("Should return no related products when category does not exist", async () => {
      const fakeCategoryId = new mongoose.Types.ObjectId();

      const response = await request(app).get(
        `/api/v1/product/related-product/${pid}/${fakeCategoryId}`
      );

      expect(response.status).toBe(200);

      const { products } = response.body;
      expect(products).toHaveLength(0);
    });

    it("Should return related products to the category when product ID does not exist", async () => {
      const fakeProductId = new mongoose.Types.ObjectId();

      const response = await request(app).get(
        `/api/v1/product/related-product/${fakeProductId}/${cid}`
      );

      expect(response.status).toBe(200);

      const { products } = response.body;
      expect(products).toHaveLength(2);
      expect(products[0]).toHaveProperty("name", "phone");
      expect(products[1]).toHaveProperty("name", "laptop");
    });

    it("Should return no related products when both product ID and category does not exist", async () => {
      const fakeProductId = new mongoose.Types.ObjectId();
      const fakeCategoryId = new mongoose.Types.ObjectId();

      const response = await request(app).get(
        `/api/v1/product/related-product/${fakeProductId}/${fakeCategoryId}`
      );

      expect(response.status).toBe(200);

      const { products } = response.body;
      expect(products).toHaveLength(0);
    });
  });

  describe("GET /api/v1/product/product-photo", () => {
    let pid, pidPhoto, pidNoPhoto;

    beforeEach(async () => {
      await productModel.deleteMany({});
      const productWithPhoto = await productModel.create({
        name: "book",
        slug: "book",
        description: "book description",
        price: 10,
        category: new mongoose.Types.ObjectId("67d18a47b92dddc71c78f644"),
        quantity: 20,
      });

      productWithPhoto.photo.data = Buffer.from("photo data");
      productWithPhoto.photo.contentType = "image/jpeg";
      await productWithPhoto.save();

      pidPhoto = productWithPhoto._id;

      const productWithoutPhoto = await productModel.create({
        name: "laptop",
        slug: "laptop",
        description: "laptop description",
        price: 2000,
        category: new mongoose.Types.ObjectId("67d18a5fe08b3e56cc31552c"),
        quantity: 25,
      });

      pidNoPhoto = productWithoutPhoto._id;
    });

    it("Should return the photo of the product", async () => {
      pid = pidPhoto;
      const response = await request(app).get(
        `/api/v1/product/product-photo/${pid}`
      );

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toBe("image/jpeg");
      expect(response.body).toEqual(Buffer.from("photo data"));
    });

    it("Should return an error if no photo can be found", async () => {
      pid = pidNoPhoto;
      const response = await request(app).get(
        `/api/v1/product/product-photo/${pid}`
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "No photo found");
    });
  });

  describe("GET /api/v1/product/product-category", () => {
    let cid;

    beforeEach(async () => {
      await productModel.deleteMany({});
      await categoryModel.deleteMany({});

      const categories = await categoryModel.create([
        {
          name: "Electronics",
          slug: "electronics",
        },
        {
          name: "Furniture",
          slug: "furniture",
        },
      ]);
      cid = categories[0]._id;

      await productModel.create([
        {
          name: "book",
          slug: "book",
          description: "book description",
          price: 10,
          category: new mongoose.Types.ObjectId("67d18a47b92dddc71c78f644"),
          quantity: 20,
        },
        {
          name: "laptop",
          slug: "laptop",
          description: "laptop description",
          price: 2000,
          category: cid,
          quantity: 25,
        },
        {
          name: "phone",
          slug: "phone",
          description: "phone description",
          price: 1200,
          category: cid,
          quantity: 10,
        },
      ]);
    });

    it("Should return products of the given category", async () => {
      const slug = "electronics";
      const response = await request(app).get(
        `/api/v1/product/product-category/${slug}`
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("products");
      expect(response.body.products).toHaveLength(2);

      const { products } = response.body;
      products.sort((a, b) => a.name.localeCompare(b.name));

      expect(products).toHaveLength(2);
      expect(products[0]).toHaveProperty("name", "laptop");
      expect(products[0]).toHaveProperty("slug", "laptop");

      expect(products[1]).toHaveProperty("name", "phone");
      expect(products[1]).toHaveProperty("slug", "phone");
    });

    it("Should return an empty list when there are no products in the category", async () => {
      const slug = "furniture";
      const response = await request(app).get(
        `/api/v1/product/product-category/${slug}`
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("products");
      expect(response.body.products).toHaveLength(0);
    });

    it("Should return an error message if category does not exist", async () => {
      const slug = "does-not-exist";
      const response = await request(app).get(
        `/api/v1/product/product-category/${slug}`
      );

      expect(response.status).toBe(404);

      const { success, message } = response.body;
      expect(success).toBe(false);
      expect(message).toBe("Category Not Found");
    });
  });

  describe("GET /api/v1/product/product-count", () => {
    beforeEach(async () => {
      await productModel.deleteMany({});
      await productModel.create([
        {
          name: "watch",
          slug: "watch",
          description: "watch description",
          price: 100,
          category: new mongoose.Types.ObjectId("67d18a47b92dddc71c78f644"),
          quantity: 5,
        },
        {
          name: "sofa",
          slug: "sofa",
          description: "sofa description",
          price: 500,
          category: new mongoose.Types.ObjectId("67d18a5fe08b3e56cc31552c"),
          quantity: 10,
        },
      ]);
    });

    it("Should return the count of all products", async () => {
      const response = await request(app).get("/api/v1/product/product-count");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("total", 2);
    });
  });

  describe("GET /api/v1/product/product-list", () => {
    beforeEach(async () => {
      await productModel.deleteMany({});
      await productModel.create([
        {
          name: "table",
          slug: "table",
          description: "table description",
          price: 100,
          category: new mongoose.Types.ObjectId("67d2e2bbd287b473192ea731"),
          quantity: 20,
        },
        {
          name: "lamp",
          slug: "lamp",
          description: " description",
          price: 50,
          category: new mongoose.Types.ObjectId("67d2e2b0ca8e90f3e42e1c77"),
          quantity: 100,
        },
        {
          name: "chair",
          slug: "chair",
          description: "chair description",
          price: 150,
          category: new mongoose.Types.ObjectId("67d2e29a1213c588a91f0ad4"),
          quantity: 50,
        },
        {
          name: "sofa",
          slug: "sofa",
          description: "sofa description",
          price: 500,
          category: new mongoose.Types.ObjectId("67d18a5fe08b3e56cc31552c"),
          quantity: 10,
        },
        {
          name: "watch",
          slug: "watch",
          description: "watch description",
          price: 100,
          category: new mongoose.Types.ObjectId("67d2e29a1213c588a91f0ad4"),
          quantity: 5,
        },
        {
          name: "phone",
          slug: "phone",
          description: "phone description",
          price: 1200,
          category: new mongoose.Types.ObjectId("67d2e29156a5fa0c85fa5796"),
          quantity: 24,
        },
      ]);
    });

    it("Should return the list of products on the current page", async () => {
      const page = 1;
      const response = await request(app).get(
        `/api/v1/product/product-list/${page}`
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("products");

      const { products } = response.body;
      expect(products).toHaveLength(6);
    });
  });

  describe("GET /api/v1/product/braintree/token", () => {
    let originalMerchantId, originalPublicKey, originalPrivateKey;

    beforeEach(() => {
      originalMerchantId = process.env.BRAINTREE_MERCHANT_ID;
      originalPublicKey = process.env.BRAINTREE_PUBLIC_KEY;
      originalPrivateKey = process.env.BRAINTREE_PRIVATE_KEY;
    });

    afterEach(() => {
      process.env.BRAINTREE_MERCHANT_ID = originalMerchantId;
      process.env.BRAINTREE_PUBLIC_KEY = originalPublicKey;
      process.env.BRAINTREE_PRIVATE_KEY = originalPrivateKey;
    });

    it("Should return a Braintree client token", async () => {
      const response = await request(app).get(
        "/api/v1/product/braintree/token"
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("clientToken");

      const { clientToken } = response.body;
      expect(typeof clientToken).toBe("string");
    });

    it("Should return an error message if Braintree client token generation fails", async () => {
      // override credentials with invalid values to simulate a failure
      process.env.BRAINTREE_MERCHANT_ID = "invalid-merchant-id";
      process.env.BRAINTREE_PUBLIC_KEY = "invalid-public-key";
      process.env.BRAINTREE_PRIVATE_KEY = "invalid-private-key";

      const response = await request(app).get(
        "/api/v1/product/braintree/token"
      );

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("name", "authenticationError");
      expect(response.body).toHaveProperty("type", "authenticationError");
    });
  });

  describe("POST /api/v1/product/braintree/payment", () => {
    let token, pid;

    beforeEach(async () => {
      await userModel.deleteMany({});
      await productModel.deleteMany({});
      await orderModel.deleteMany({});

      const user = await userModel.create({
        name: "Normal User",
        email: "user@example.com",
        password: "password",
        phone: "1234567890",
        address: {
          street: "Jurong West Street 21",
          city: "Singapore",
          zip: "123456",
        },
        answer: "idk",
        DOB: new Date("2000-02-02"),
        cart: [],
        role: 0,
      });

      const product = await productModel.create({
        name: "book",
        slug: "book",
        description: "book description",
        price: 10,
        category: new mongoose.Types.ObjectId("67d18a47b92dddc71c78f644"),
        quantity: 20,
      });

      pid = product._id;

      token = JWT.sign({ _id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });
    });

    it("Should process a payment when user is authenticated", async () => {
      const response = await request(app)
        .post("/api/v1/product/braintree/payment")
        .set("Authorization", `${token}`)
        .send({
          nonce: "fake-valid-nonce",
          cart: [{ _id: pid, price: 10 }],
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("ok", true);
    });

    it("Should not process payment if user is not authenticated", async () => {
      const response = await request(app)
        .post("/api/v1/product/braintree/payment")
        .send({
          nonce: "fake-valid-nonce",
          cart: [{ _id: pid, price: 10 }],
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "Unauthorized Access");
    });

    it("Should not process payment if error occurs during payment processing", async () => {
      const response = await request(app)
        .post("/api/v1/product/braintree/payment")
        .set("Authorization", `${token}`)
        .send({
          nonce: "fake-gateway-rejected-cvv-nonce",
          cart: [{ _id: pid, price: 10 }],
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("ok", false);
    });
  });
});
