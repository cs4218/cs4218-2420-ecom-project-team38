import mongoose from "mongoose";
import connectDB from "./db";
import { jest } from "@jest/globals";

const mockConnect = jest.fn();

jest.mock("mongoose", () => ({ connect: mockConnect }));

describe("Database connection", () => {
  let mongoServer;
  const testUri = "test-uri";

  beforeAll(() => {
    process.env.MONGO_URL = testUri;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Should connect to the database", async () => {
    mongoose.connect = jest.fn().mockResolvedValueOnce({
      connection: { host: "host" },
    });
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    await connectDB();

    expect(consoleSpy).toHaveBeenCalledWith(
      `Connected To Mongodb Database host`.bgMagenta.white
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
