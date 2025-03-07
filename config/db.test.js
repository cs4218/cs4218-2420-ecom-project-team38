import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import connectDB from "./db";
import { jest } from "@jest/globals";

describe("Database connection", () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    process.env.MONGO_URL = mongoUri;
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it("Should connect to the database", async () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    await connectDB();

    expect(mongoose.connection.readyState).toBe(1);
    expect(consoleSpy).toHaveBeenCalledWith(
      `Connected To Mongodb Database ${mongoServer.instanceInfo.ip}`.bgMagenta
        .white
    );
  });

  it("Should log error when connection fails", async () => {
    const mockError = new Error("Connection failed");
    jest
      .spyOn(mongoose, "connect")
      .mockRejectedValueOnce(mockError)
      .mockImplementationOnce(() => {});
    const consoleSpy = jest.spyOn(console, "log");

    await connectDB();

    expect(consoleSpy).toHaveBeenCalledWith(
      `Error in Mongodb ${mockError}`.bgRed.white
    );
  });
});
