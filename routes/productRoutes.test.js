import Express from "express";
import productRoutes from "./productRoutes";
import request from "supertest";
import productModel from "../models/productModel";
import mongoose from "mongoose";

const app = Express();
app.use("/api/v1/product", productRoutes);

describe("Product Routes", () => {
  describe("GET /api/v1/product/search", () => {
    beforeEach(async () => {
      await productModel.deleteMany({});
      await productModel.create([
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
      ]);
    });

    it("Should return a list of products containing matching keyword", async () => {
      const keyword = "phone";
      const response = await request(app).get(
        `/api/v1/product/search/${keyword}`
      );
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty("name", "phone");
      expect(response.body[0]).toHaveProperty("slug", "phone");
      expect(response.body[0]).toHaveProperty(
        "description",
        "phone description"
      );
      expect(response.body[0]).toHaveProperty("price", 1000);
      expect(response.body[0]).toHaveProperty("category");
      expect(response.body[0]).toHaveProperty("quantity", 10);
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
});
