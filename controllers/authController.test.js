import { jest } from "@jest/globals";
import userModel from "../models/userModel";

jest.mock("../models/userModel");

jest.spyOn(console, "log").mockImplementation(() => {});

// module mocking in ESM
const mockHashPassword = jest.fn();
const mockIsPasswordValid = jest.fn();
const mockIsPhoneValid = jest.fn();
jest.unstable_mockModule("../helpers/authHelper", () => ({
  hashPassword: mockHashPassword,
  comparePassword: jest.fn(),
  isPasswordValid: mockIsPasswordValid,
  isPhoneValid: mockIsPhoneValid,
}));
const { updateProfileController } = await import("./authController");

describe("Update Profile Controller", () => {
  const mockUserId = "testid123";
  const mockHashedPassword = "hashed$password";

  let mockUser, validUpdatedProfile, res;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUser = {
      name: "Test User",
      email: "testuser@gmail.com",
      password: "testpassword123",
      phone: "98765432",
      address: "123 Test Address",
    };

    validUpdatedProfile = {
      name: "New User",
      email: "testuser@gmail.com", // same email
      password: "newpassword456",
      phone: "87654321",
      address: "456 New Address",
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn(),
    };

    mockHashPassword.mockResolvedValue(mockHashedPassword);
    mockIsPasswordValid.mockReturnValue("");
    mockIsPhoneValid.mockReturnValue("");
  });

  describe("Database update", () => {
    it("should update the database with the correct trimmed values", async () => {
      const req = {
        body: {
          name: "  Test User",
          email: "testuser@gmail.com",
          password: "",
          phone: "98765432  ",
          address: "  123 Test Address  ",
        },
        user: { _id: mockUserId },
      };

      userModel.findById = jest.fn().mockResolvedValue({ ...mockUser });
      userModel.findByIdAndUpdate = jest.fn();

      await updateProfileController(req, res);

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUserId,
        {
          name: "Test User",
          password: mockUser.password,
          phone: "98765432",
          address: "123 Test Address",
        },
        { new: true }
      );
    });

    it("should update the database with the correct hashed password if provided", async () => {
      const newPassword = "newpassword456";
      const req = {
        body: { ...validUpdatedProfile, password: newPassword },
        user: { _id: mockUserId },
      };

      userModel.findById = jest.fn().mockResolvedValue({ ...mockUser });
      userModel.findByIdAndUpdate = jest.fn();

      await updateProfileController(req, res);

      expect(mockHashPassword).toHaveBeenCalledWith(newPassword);
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUserId,
        {
          name: validUpdatedProfile.name,
          password: mockHashedPassword,
          phone: validUpdatedProfile.phone,
          address: validUpdatedProfile.address,
        },
        { new: true }
      );
    });

    it("should send successful response with updated profile when database update is successful", async () => {
      const req = {
        body: { ...validUpdatedProfile },
        user: { _id: mockUserId },
      };

      userModel.findById = jest.fn().mockResolvedValue({ ...mockUser });
      userModel.findByIdAndUpdate = jest
        .fn()
        .mockResolvedValue({ ...validUpdatedProfile });

      await updateProfileController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Profile Updated Successfully",
        updatedUser: validUpdatedProfile,
      });
    });
  });

  describe("Field validation", () => {
    it("should send response with error message when name is empty or blank", async () => {
      const req = {
        body: { ...validUpdatedProfile, name: "  " },
        user: { _id: mockUserId },
      };

      userModel.findById = jest.fn().mockResolvedValue({ ...mockUser });
      userModel.findByIdAndUpdate = jest.fn();

      await updateProfileController(req, res);

      expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        error: "Name, address and phone are required",
      });
    });

    it("should send response with error message when phone is empty or blank", async () => {
      const req = {
        body: { ...validUpdatedProfile, phone: "  " },
        user: { _id: mockUserId },
      };

      userModel.findById = jest.fn().mockResolvedValue({ ...mockUser });
      userModel.findByIdAndUpdate = jest.fn();

      await updateProfileController(req, res);

      expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        error: "Name, address and phone are required",
      });
    });

    it("should send response with error message when address is empty or blank", async () => {
      const req = {
        body: { ...validUpdatedProfile, address: "  " },
        user: { _id: mockUserId },
      };

      userModel.findById = jest.fn().mockResolvedValue({ ...mockUser });
      userModel.findByIdAndUpdate = jest.fn();

      await updateProfileController(req, res);

      expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        error: "Name, address and phone are required",
      });
    });

    it("should send response with error message when password is non-empty and invalid", async () => {
      const newPassword = "2weak";
      const passwordErrorMsg = "Passsword should be at least 6 characters long";
      const req = {
        body: { ...validUpdatedProfile, password: newPassword },
        user: { _id: mockUserId },
      };

      mockIsPasswordValid.mockReturnValue(passwordErrorMsg);
      userModel.findById = jest.fn().mockResolvedValue({ ...mockUser });
      userModel.findByIdAndUpdate = jest.fn();

      await updateProfileController(req, res);

      expect(mockIsPasswordValid).toHaveBeenCalledWith(newPassword);
      expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ error: passwordErrorMsg });
    });

    it("should send response with error message when phone is non-empty and invalid", async () => {
      const newPhone = "98abc43";
      const phoneErrorMsg =
        "Phone should be 8 digits long and begin with 6, 8 or 9";
      const req = {
        body: { ...validUpdatedProfile, phone: newPhone },
        user: { _id: mockUserId },
      };

      mockIsPhoneValid.mockReturnValue(phoneErrorMsg);
      userModel.findById = jest.fn().mockResolvedValue({ ...mockUser });
      userModel.findByIdAndUpdate = jest.fn();

      await updateProfileController(req, res);

      expect(mockIsPhoneValid).toHaveBeenCalledWith(newPhone);
      expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ error: phoneErrorMsg });
    });
  });

  describe("Error handling", () => {
    it("should send error response when error reading profile from database", async () => {
      const dbReadError = new Error("Database read error");
      const req = {
        body: { ...validUpdatedProfile },
        user: { _id: mockUserId },
      };

      userModel.findById = jest.fn().mockRejectedValue(dbReadError);
      userModel.findByIdAndUpdate = jest.fn();

      await updateProfileController(req, res);

      expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error While Updating Profile",
        error: dbReadError,
      });
    });

    it("should send error response when error updating profile to database", async () => {
      const dbUpdateError = new Error("Database update error");
      const req = {
        body: { ...validUpdatedProfile },
        user: { _id: mockUserId },
      };

      userModel.findById = jest.fn().mockResolvedValue({ ...mockUser });
      userModel.findByIdAndUpdate = jest.fn().mockRejectedValue(dbUpdateError);

      await updateProfileController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error While Updating Profile",
        error: dbUpdateError,
      });
    });

    it("should send error response when error hashing password", async () => {
      const hashError = new Error("Hash error");
      const req = {
        body: { ...validUpdatedProfile },
        user: { _id: mockUserId },
      };

      mockHashPassword.mockRejectedValue(hashError);
      userModel.findById = jest.fn().mockResolvedValue({ ...mockUser });
      userModel.findByIdAndUpdate = jest.fn();

      await updateProfileController(req, res);

      expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error While Updating Profile",
        error: hashError,
      });
    });
  });
});
