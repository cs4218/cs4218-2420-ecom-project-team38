import { jest } from "@jest/globals";
import { updateProfileController } from "./authController";
import userModel from "../models/userModel";

jest.mock("../models/userModel");

// TODO: mock hashPassword
// jest.mock("../helpers/authHelper.js");
// jest.mock("../helpers/authHelper.js", () => ({
//   hashPassword: jest
//     .fn()
//     .mockImplementation((password) => Promise.resolve(password)),
// }));

describe("Update Profile Controller", () => {
  let mockUser, mockUserId;
  let validUpdatedProfile;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUser = {
      name: "Test User",
      email: "testuser@gmail.com",
      password: "testpassword123",
      phone: "98765432",
      address: "123 Test Address",
    };

    mockUserId = "testid123";

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
  });

  describe("Required fields", () => {
    it("should succeed when all required fields have valid values", async () => {
      const req = {
        body: { ...validUpdatedProfile },
        user: { _id: mockUserId },
      };

      userModel.findById = jest.fn().mockResolvedValue({ ...mockUser });
      userModel.findByIdAndUpdate = jest
        .fn()
        .mockResolvedValue({ ...validUpdatedProfile });

      await updateProfileController(req, res);

      // expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
      //   mockUserId,
      //   {
      //     name: validUpdatedProfile.name,
      //     password: validUpdatedProfile.password,
      //     phone: validUpdatedProfile.phone,
      //     address: validUpdatedProfile.address,
      //   },
      //   { new: true }
      // );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Profile Updated Successfully",
        updatedUser: validUpdatedProfile,
      });
    });

    it("should fail when name is empty or blank", async () => {
      const req = {
        body: {
          ...validUpdatedProfile,
          name: " ",
        },
        user: { _id: mockUserId },
      };

      userModel.findById = jest.fn().mockResolvedValue({ ...mockUser });
      userModel.findByIdAndUpdate = jest.fn();

      await updateProfileController(req, res);

      expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        error:
          "Please fill in all fields (password can be left empty to keep it unchanged)",
      });
    });

    it("should fail when phone is empty or blank", async () => {
      const req = {
        body: {
          ...validUpdatedProfile,
          phone: "  ",
        },
        user: { _id: mockUserId },
      };

      userModel.findById = jest.fn().mockResolvedValue({ ...mockUser });
      userModel.findByIdAndUpdate = jest.fn();

      await updateProfileController(req, res);

      expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        error:
          "Please fill in all fields (password can be left empty to keep it unchanged)",
      });
    });

    it("should fail when address is empty or blank", async () => {
      const req = {
        body: {
          ...validUpdatedProfile,
          address: "  ",
        },
        user: { _id: mockUserId },
      };

      userModel.findById = jest.fn().mockResolvedValue({ ...mockUser });
      userModel.findByIdAndUpdate = jest.fn();

      await updateProfileController(req, res);

      expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        error:
          "Please fill in all fields (password can be left empty to keep it unchanged)",
      });
    });
  });

  describe("Email field", () => {
    it("should succeed but should not update email even when email is changed", async () => {
      const newEmail = "newemail@gmail.com";
      const req = {
        body: {
          ...validUpdatedProfile,
          email: newEmail,
        },
        user: { _id: mockUserId },
      };

      userModel.findById = jest.fn().mockResolvedValue({ ...mockUser });
      userModel.findByIdAndUpdate = jest
        .fn()
        .mockResolvedValue({ ...validUpdatedProfile });

      await updateProfileController(req, res);

      // expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
      //   mockUserId,
      //   {
      //     name: validUpdatedProfile.name,
      //     password: validUpdatedProfile.password,
      //     phone: validUpdatedProfile.phone,
      //     address: validUpdatedProfile.address,
      //   },
      //   { new: true }
      // );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Profile Updated Successfully",
        updatedUser: validUpdatedProfile,
      });
    });
  });

  describe("Password validation", () => {
    it("should succeed when password is exactly 6 characters", async () => {
      const newPassword = "im6chr";
      const req = {
        body: {
          ...validUpdatedProfile,
          password: newPassword,
        },
        user: { _id: mockUserId },
      };

      userModel.findById = jest.fn().mockResolvedValue({ ...mockUser });
      userModel.findByIdAndUpdate = jest.fn().mockResolvedValue({
        ...validUpdatedProfile,
        password: newPassword,
      });

      await updateProfileController(req, res);

      // expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
      //   mockUserId,
      //   {
      //     name: validUpdatedUser.name,
      //     password: newPassword,
      //     phone: validUpdatedUser.phone,
      //     address: validUpdatedUser.address,
      //   },
      //   { new: true }
      // );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Profile Updated Successfully",
        updatedUser: {
          ...validUpdatedProfile,
          password: newPassword,
        },
      });
    });

    it("should succeed when password is more than 6 characters", async () => {
      const newPassword = "strongpassword42";
      const req = {
        body: {
          ...validUpdatedProfile,
          password: newPassword,
        },
        user: { _id: mockUserId },
      };

      userModel.findById = jest.fn().mockResolvedValue({ ...mockUser });
      userModel.findByIdAndUpdate = jest.fn().mockResolvedValue({
        ...validUpdatedProfile,
        password: newPassword,
      });

      await updateProfileController(req, res);

      // expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
      //   mockUserId,
      //   {
      //     name: validUpdatedUser.name,
      //     password: newPassword,
      //     phone: validUpdatedUser.phone,
      //     address: validUpdatedUser.address,
      //   },
      //   { new: true }
      // );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Profile Updated Successfully",
        updatedUser: {
          ...validUpdatedProfile,
          password: newPassword,
        },
      });
    });

    it("should succeed but should not update password when password is empty or blank", async () => {
      const newPassword = " ";
      const req = {
        body: {
          ...validUpdatedProfile,
          password: newPassword,
        },
        user: { _id: mockUserId },
      };

      userModel.findById = jest.fn().mockResolvedValue({ ...mockUser });
      userModel.findByIdAndUpdate = jest.fn().mockResolvedValue({
        ...validUpdatedProfile,
        password: mockUser.password,
      });

      await updateProfileController(req, res);

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUserId,
        {
          name: validUpdatedProfile.name,
          password: mockUser.password,
          phone: validUpdatedProfile.phone,
          address: validUpdatedProfile.address,
        },
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Profile Updated Successfully",
        updatedUser: {
          ...validUpdatedProfile,
          password: mockUser.password,
        },
      });
    });

    it("should fail when password is non-empty and less than 6 characters", async () => {
      const newPassword = "2weak";
      const req = {
        body: {
          ...validUpdatedProfile,
          password: newPassword,
        },
        user: { _id: mockUserId },
      };

      userModel.findById = jest.fn().mockResolvedValue({ ...mockUser });
      userModel.findByIdAndUpdate = jest.fn();

      await updateProfileController(req, res);

      expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        error: "Passsword should be at least 6 characters long",
      });
    });
  });

  describe("Phone validation", () => {
    it("should succeed when phone is 8 digits and starts with 6", async () => {
      const newPhone = "61234567";
      const req = {
        body: {
          ...validUpdatedProfile,
          phone: newPhone,
        },
        user: { _id: mockUserId },
      };

      userModel.findById = jest.fn().mockResolvedValue({ ...mockUser });
      userModel.findByIdAndUpdate = jest.fn().mockResolvedValue({
        ...validUpdatedProfile,
        phone: newPhone,
      });

      await updateProfileController(req, res);

      // expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
      //   mockUserId,
      //   {
      //     name: validUpdatedProfile.name,
      //     password: validUpdatedProfile.password,
      //     phone: newPhone,
      //     address: validUpdatedProfile.address,
      //   },
      //   { new: true }
      // );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Profile Updated Successfully",
        updatedUser: {
          ...validUpdatedProfile,
          phone: newPhone,
        },
      });
    });

    it("should succeed when phone is 8 digits and starts with 8", async () => {
      const newPhone = "81234567";
      const req = {
        body: {
          ...validUpdatedProfile,
          phone: newPhone,
        },
        user: { _id: mockUserId },
      };

      userModel.findById = jest.fn().mockResolvedValue({ ...mockUser });
      userModel.findByIdAndUpdate = jest.fn().mockResolvedValue({
        ...validUpdatedProfile,
        phone: newPhone,
      });

      await updateProfileController(req, res);

      // expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
      //   mockUserId,
      //   {
      //     name: validUpdatedProfile.name,
      //     password: validUpdatedProfile.password,
      //     phone: newPhone,
      //     address: validUpdatedProfile.address,
      //   },
      //   { new: true }
      // );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Profile Updated Successfully",
        updatedUser: {
          ...validUpdatedProfile,
          phone: newPhone,
        },
      });
    });

    it("should succeed when phone is 8 digits and starts with 9", async () => {
      const newPhone = "91234567";
      const req = {
        body: {
          ...validUpdatedProfile,
          phone: newPhone,
        },
        user: { _id: mockUserId },
      };

      userModel.findById = jest.fn().mockResolvedValue({ ...mockUser });
      userModel.findByIdAndUpdate = jest.fn().mockResolvedValue({
        ...validUpdatedProfile,
        phone: newPhone,
      });

      await updateProfileController(req, res);

      // expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
      //   mockUserId,
      //   {
      //     name: validUpdatedProfile.name,
      //     password: validUpdatedProfile.password,
      //     phone: newPhone,
      //     address: validUpdatedProfile.address,
      //   },
      //   { new: true }
      // );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Profile Updated Successfully",
        updatedUser: {
          ...validUpdatedProfile,
          phone: newPhone,
        },
      });
    });

    it("should fail when phone is less than 8 digits", async () => {
      const newPhone = "9876543";
      const req = {
        body: {
          ...validUpdatedProfile,
          phone: newPhone,
        },
        user: { _id: mockUserId },
      };

      userModel.findById = jest.fn().mockResolvedValue({ ...mockUser });
      userModel.findByIdAndUpdate = jest.fn();

      await updateProfileController(req, res);

      expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        error: "Phone should be 8 digits long and begin with 6, 8 or 9",
      });
    });

    it("should fail when phone is more than 8 digits", async () => {
      const newPhone = "987654321";
      const req = {
        body: {
          ...validUpdatedProfile,
          phone: newPhone,
        },
        user: { _id: mockUserId },
      };

      userModel.findById = jest.fn().mockResolvedValue({ ...mockUser });
      userModel.findByIdAndUpdate = jest.fn();

      await updateProfileController(req, res);

      expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        error: "Phone should be 8 digits long and begin with 6, 8 or 9",
      });
    });

    it("should fail when phone does not start with 6, 8 or 9", async () => {
      const newPhone = "12345678";
      const req = {
        body: {
          ...validUpdatedProfile,
          phone: newPhone,
        },
        user: { _id: mockUserId },
      };

      userModel.findById = jest.fn().mockResolvedValue({ ...mockUser });
      userModel.findByIdAndUpdate = jest.fn();

      await updateProfileController(req, res);

      expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        error: "Phone should be 8 digits long and begin with 6, 8 or 9",
      });
    });

    it("should fail when phone is non-numeric", async () => {
      const newPhone = "98abc43";
      const req = {
        body: {
          ...validUpdatedProfile,
          phone: newPhone,
        },
        user: { _id: mockUserId },
      };

      userModel.findById = jest.fn().mockResolvedValue({ ...mockUser });
      userModel.findByIdAndUpdate = jest.fn();

      await updateProfileController(req, res);

      expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        error: "Phone should be 8 digits long and begin with 6, 8 or 9",
      });
    });
  });

  describe("Error handling", () => {
    it("should handle error retrieving user profile from database", async () => {
      const errorMsg = "Error retrieving user profile";
      const req = {
        body: { ...validUpdatedProfile },
        user: { _id: mockUserId },
      };

      userModel.findById = jest.fn().mockRejectedValue(errorMsg);
      userModel.findByIdAndUpdate = jest.fn();

      await updateProfileController(req, res);

      expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error While Updating Profile",
        error: errorMsg,
      });
    });

    it("should handle error updating user profile to database", async () => {
      const errorMsg = "Error updating user profile";
      const req = {
        body: { ...validUpdatedProfile },
        user: { _id: mockUserId },
      };

      userModel.findById = jest.fn().mockResolvedValue({ ...mockUser });
      userModel.findByIdAndUpdate = jest.fn().mockRejectedValue(errorMsg);

      await updateProfileController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error While Updating Profile",
        error: errorMsg,
      });
    });
  });
});
