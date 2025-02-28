import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import { requireSignIn, isAdmin } from "./authMiddleware";
import userModel from "../models/userModel";

jest.mock("jsonwebtoken");

jest.mock("../models/userModel");

jest.spyOn(console, "log").mockImplementation(() => {});

describe("Auth Middleware", () => {
  describe("Require sign in middleware", () => {
    let req, res, next;

    beforeEach(() => {
      jest.clearAllMocks();
      req = { headers: { authorization: "" } };
      res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
      next = jest.fn();
    });

    it("Should call next() if token is valid", async () => {
      req = { headers: { authorization: "token" } };
      const mockDecodedToken = { _id: "123" };
      jwt.verify = jest.fn().mockReturnValue(mockDecodedToken);

      await requireSignIn(req, res, next);

      expect(jwt.verify).toHaveBeenCalledTimes(1);
      expect(req.user).toBe(mockDecodedToken);
      expect(next).toHaveBeenCalledTimes(1);
    });

    it("Should throw an error if authorization header is missing", async () => {
      req = { headers: {} };
      const mockError = new Error("Authorization header is missing");
      jwt.verify = jest.fn().mockImplementation(() => {
        throw mockError;
      });

      await requireSignIn(req, res, next);

      expect(jwt.verify).toHaveBeenCalledTimes(1);
      expect(next).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(mockError);
    });

    it("Should throw an error if token is invalid", async () => {
      req = { headers: { authorization: "invalid token" } };
      const mockError = new Error("Invalid token");
      jwt.verify = jest.fn().mockImplementation(() => {
        throw mockError;
      });

      await requireSignIn(req, res, next);

      expect(jwt.verify).toHaveBeenCalledTimes(1);
      expect(next).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(mockError);
    });

    it("Should send 401 if token is invalid", async () => {
      req = { headers: { authorization: "invalid token" } };
      const mockError = new Error("Invalid token");
      jwt.verify = jest.fn().mockImplementation(() => {
        throw mockError;
      });

      await requireSignIn(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: mockError,
        message: "Unauthorized Access",
      });
    });
  });

  describe("Is admin middleware", () => {
    let res, req, next;

    beforeEach(() => {
      jest.clearAllMocks();
      req = { user: { _id: "" } };
      res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
      next = jest.fn();
    });

    it("Should call next() if user is admin", async () => {
      const mockUser = { role: 1 };
      userModel.findById = jest.fn().mockResolvedValue(mockUser);

      await isAdmin(req, res, next);

      expect(userModel.findById).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledTimes(1);
    });

    it("Should return 401 if user is not admin", async () => {
      const mockUser = { role: 0 };
      userModel.findById = jest.fn().mockResolvedValue(mockUser);

      await isAdmin(req, res, next);

      expect(userModel.findById).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Unauthorized Access",
      });
    });

    it("Should return 401 if error is thrown", async () => {
      const mockError = new Error("Error in admin middleware");
      userModel.findById = jest.fn().mockRejectedValue(mockError);

      await isAdmin(req, res, next);

      expect(userModel.findById).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: mockError,
        message: "Error in admin middleware",
      });
    });
  });
});
