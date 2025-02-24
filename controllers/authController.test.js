import { jest } from "@jest/globals";
import userModel from "../models/userModel";
import orderModel from "../models/orderModel";

jest.mock("../models/userModel");

jest.mock("../models/orderModel");

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
const {
  updateProfileController,
  getOrdersController,
  getAllOrdersController,
  orderStatusController,
} = await import("./authController");

describe("Auth Controller", () => {
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

    describe("Input validation", () => {
      it("should send response with error message when name is empty or blank", async () => {
        const req = {
          body: { ...mockUser, password: "", name: "  " },
          user: { _id: mockUserId },
        };
        userModel.findByIdAndUpdate = jest.fn();

        await updateProfileController(req, res);

        expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({
          error: "Name, address and phone are required",
        });
      });

      it("should send response with error message when phone is empty or blank", async () => {
        const req = {
          body: { ...mockUser, password: "", phone: "  " },
          user: { _id: mockUserId },
        };
        userModel.findByIdAndUpdate = jest.fn();

        await updateProfileController(req, res);

        expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({
          error: "Name, address and phone are required",
        });
      });

      it("should send response with error message when address is empty or blank", async () => {
        const req = {
          body: { ...mockUser, password: "", address: "  " },
          user: { _id: mockUserId },
        };
        userModel.findByIdAndUpdate = jest.fn();

        await updateProfileController(req, res);

        expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({
          error: "Name, address and phone are required",
        });
      });

      it("should send response with error message when password is non-empty and invalid", async () => {
        const newPassword = "2weak";
        const passwordErrorMsg =
          "Passsword should be at least 6 characters long";
        const req = {
          body: { ...mockUser, password: newPassword },
          user: { _id: mockUserId },
        };
        mockIsPasswordValid.mockReturnValue(passwordErrorMsg);
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
          body: { ...mockUser, password: "", phone: newPhone },
          user: { _id: mockUserId },
        };
        mockIsPhoneValid.mockReturnValue(phoneErrorMsg);
        userModel.findByIdAndUpdate = jest.fn();

        await updateProfileController(req, res);

        expect(mockIsPhoneValid).toHaveBeenCalledWith(newPhone);
        expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({ error: phoneErrorMsg });
      });
    });

    describe("Database update", () => {
      it("should update the database with valid trimmed input values", async () => {
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

      it("should not update the database with email even when new email is provided", async () => {
        const newEmail = "newemail@gmail.com";
        const req = {
          body: { ...mockUser, password: "", email: newEmail },
          user: { _id: mockUserId },
        };
        userModel.findById = jest.fn().mockResolvedValue({ ...mockUser });
        userModel.findByIdAndUpdate = jest.fn();

        await updateProfileController(req, res);

        expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
          mockUserId,
          {
            name: mockUser.name,
            password: mockUser.password,
            phone: mockUser.phone,
            address: mockUser.address,
          },
          { new: true }
        );
      });

      it("should update the database with new hashed password when password is provided", async () => {
        const newPassword = "newpassword456";
        const req = {
          body: { ...mockUser, password: newPassword },
          user: { _id: mockUserId },
        };
        userModel.findByIdAndUpdate = jest.fn();

        await updateProfileController(req, res);

        expect(mockHashPassword).toHaveBeenCalledWith(newPassword);
        expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
          mockUserId,
          {
            name: mockUser.name,
            password: mockHashedPassword,
            phone: mockUser.phone,
            address: mockUser.address,
          },
          { new: true }
        );
      });

      it("should update the database with current hashed password when password is not provided", async () => {
        const req = {
          body: { ...mockUser, password: "" },
          user: { _id: mockUserId },
        };
        userModel.findById = jest.fn().mockResolvedValue({ ...mockUser });
        userModel.findByIdAndUpdate = jest.fn();

        await updateProfileController(req, res);

        expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
          mockUserId,
          {
            name: mockUser.name,
            password: mockUser.password,
            phone: mockUser.phone,
            address: mockUser.address,
          },
          { new: true }
        );
      });

      it("should send successful response with updated profile when database update is successful", async () => {
        const req = {
          body: { ...validUpdatedProfile },
          user: { _id: mockUserId },
        };
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

    describe("Error handling", () => {
      it("should send error response when error getting user from database", async () => {
        const dbReadError = new Error("Database error getting user");
        const req = {
          body: { ...validUpdatedProfile, password: "" },
          user: { _id: mockUserId },
        };
        userModel.findById = jest.fn().mockRejectedValue(dbReadError);
        userModel.findByIdAndUpdate = jest.fn();

        await updateProfileController(req, res);

        expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Error while updating profile",
          error: dbReadError,
        });
      });

      it("should send error response when user not found in database", async () => {
        const req = {
          body: { ...validUpdatedProfile, password: "" },
          user: { _id: mockUserId },
        };
        userModel.findById = jest.fn().mockResolvedValue(null);
        userModel.findByIdAndUpdate = jest.fn();

        await updateProfileController(req, res);

        expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "User not found",
        });
      });

      it("should send error response when error updating profile to database", async () => {
        const dbUpdateError = new Error("Database update error");
        const req = {
          body: { ...validUpdatedProfile },
          user: { _id: mockUserId },
        };
        userModel.findByIdAndUpdate = jest
          .fn()
          .mockRejectedValue(dbUpdateError);

        await updateProfileController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Error while updating profile",
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
        userModel.findByIdAndUpdate = jest.fn();

        await updateProfileController(req, res);

        expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Error while updating profile",
          error: hashError,
        });
      });
    });
  });

  describe("Get Orders Controller", () => {
    const mockUserId = "testid123";
    let req, res;

    beforeEach(() => {
      jest.clearAllMocks();

      req = { user: { _id: mockUserId } };

      res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
        json: jest.fn(),
      };
    });

    it("should get all orders where the buyer is the user from the database", async () => {
      orderModel.find = jest.fn();

      await getOrdersController(req, res);

      expect(orderModel.find).toHaveBeenCalledWith({ buyer: mockUserId });
    });

    it("should exclude the product photos when getting orders from the database", async () => {
      orderModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
      });

      await getOrdersController(req, res);

      expect(orderModel.find().populate).toHaveBeenCalledWith(
        "products",
        "-photo"
      );
    });

    it("should include the buyer's name when getting orders from the database", async () => {
      orderModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
      });

      await getOrdersController(req, res);

      expect(orderModel.find().populate).toHaveBeenCalledWith("buyer", "name");
    });

    it("should send response with all orders returned from the database find query", async () => {
      const mockOrder = {
        _id: "test_orderid",
        status: "Not Processed",
        buyer: { name: "Test User" },
        createdAt: "2025-01-13T17:02:55.129Z",
        payment: { success: true },
        products: [
          {
            _id: "test_productid",
            name: "Test Product Name",
            description: "Test Product Description",
            price: 4.99,
          },
        ],
      };

      orderModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        then: jest.fn((callback) => callback([mockOrder])),
      });

      await getOrdersController(req, res);

      expect(res.json).toHaveBeenCalledWith([mockOrder]);
    });

    it("should send error response when error getting orders from database", async () => {
      const dbError = new Error("Database error while getting orders");
      orderModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        then: jest.fn((callback) => callback(Promise.reject(dbError))),
      });

      await getOrdersController(req, res);

      expect(res.json).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error while getting orders",
        error: dbError,
      });
    });
  });

  describe("Get All Orders Controller", () => {
    const req = {};
    let res;

    beforeEach(() => {
      jest.clearAllMocks();

      res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
        json: jest.fn(),
      };
    });

    it("should get all orders from the database", async () => {
      orderModel.find = jest.fn();

      await getAllOrdersController(req, res);

      expect(orderModel.find).toHaveBeenCalledWith({});
    });

    it("should exclude the product photos when getting orders from the database", async () => {
      orderModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
      });

      await getAllOrdersController(req, res);

      expect(orderModel.find().populate).toHaveBeenCalledWith(
        "products",
        "-photo"
      );
    });

    it("should include the buyers' names when getting orders from the database", async () => {
      orderModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
      });

      await getAllOrdersController(req, res);

      expect(orderModel.find().populate).toHaveBeenCalledWith("buyer", "name");
    });

    it("should sort from most to least recent when getting orders from the database", async () => {
      orderModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn(),
      });

      await getAllOrdersController(req, res);

      expect(orderModel.find().sort).toHaveBeenCalledWith({ createdAt: "-1" });
    });

    it("should send response with all orders returned from the database find query", async () => {
      const mockOrder = {
        _id: "test_orderid",
        status: "Not Processed",
        buyer: { name: "Test User" },
        createdAt: "2025-01-13T17:02:55.129Z",
        payment: { success: true },
        products: [
          {
            _id: "test_productid",
            name: "Test Product Name",
            description: "Test Product Description",
            price: 4.99,
          },
        ],
      };

      orderModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        then: jest.fn((callback) => callback([mockOrder])),
      });

      await getAllOrdersController(req, res);

      expect(res.json).toHaveBeenCalledWith([mockOrder]);
    });

    it("should send error response when error getting all orders from database", async () => {
      const dbError = new Error("Database error while getting all orders");
      orderModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        then: jest.fn((callback) => callback(Promise.reject(dbError))),
      });

      await getAllOrdersController(req, res);

      expect(res.json).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error while getting all orders",
        error: dbError,
      });
    });
  });

  describe("Order Status Controller", () => {
    let mockOrderId, mockOrderStatus, req, res;

    beforeEach(() => {
      jest.clearAllMocks();

      mockOrderId = "testOrderId123";
      mockOrderStatus = "Not Processed";

      req = {
        params: { orderId: mockOrderId },
        body: { status: mockOrderStatus },
      };

      res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
        json: jest.fn(),
      };
    });

    it("should update the database with the correct order id and status", async () => {
      orderModel.findByIdAndUpdate = jest.fn();

      await orderStatusController(req, res);

      expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockOrderId,
        { status: mockOrderStatus },
        { new: true }
      );
    });

    it("should send response with updated order when database update is successful", async () => {
      const mockOrder = {
        _id: "test_orderid",
        status: "Not Processed",
        buyer: { name: "Test User" },
        createdAt: "2025-01-13T17:02:55.129Z",
        payment: { success: true },
        products: [
          {
            _id: "test_productid",
            name: "Test Product Name",
            description: "Test Product Description",
            price: 4.99,
          },
        ],
      };

      orderModel.findByIdAndUpdate = jest.fn().mockResolvedValue([mockOrder]);

      await orderStatusController(req, res);

      expect(res.json).toHaveBeenCalledWith([mockOrder]);
    });

    it("should send error response when order not found in database", async () => {
      orderModel.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

      await orderStatusController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Order not found",
      });
    });

    it("should send error response when error updating order status to database", async () => {
      const dbError = new Error("Database error while updating order");
      orderModel.findByIdAndUpdate = jest.fn().mockRejectedValue(dbError);

      await orderStatusController(req, res);

      expect(res.json).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error while updating order",
        error: dbError,
      });
    });
  });
});
