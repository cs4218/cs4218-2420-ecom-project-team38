import { jest } from "@jest/globals";
import bcrypt from "bcrypt";
import {
  hashPassword,
  comparePassword,
  isPasswordValid,
  isPhoneValid,
  isEmailValid,
  emailErrorMsg,
} from "./authHelper";

jest.mock("bcrypt");

jest.spyOn(console, "log").mockImplementation(() => {});

describe("Auth Helper", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("hashPassword", () => {
    const password = "testpassword123";

    it("should return the correct hashed password", async () => {
      const mockHashedPassword = "hashed$password";

      bcrypt.hash = jest.fn().mockResolvedValue(mockHashedPassword);

      const hashedPassword = await hashPassword(password);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(hashedPassword).toBe(mockHashedPassword);
    });

    it("should throw an error when bcrypt hash fails", async () => {
      bcrypt.hash = jest.fn().mockRejectedValue(new Error("Hash error"));

      await expect(hashPassword(password)).rejects.toThrow();
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
    });
  });

  describe("comparePassword", () => {
    const password = "testpassword123";
    const hashedPassword = "test$password$123";

    it("should return true when password is correct", async () => {
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      const result = await comparePassword(password, hashedPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toBe(true);
    });

    it("should return false when password is wrong", async () => {
      const wrongPassword = "wrongpassword123";

      bcrypt.compare = jest.fn().mockResolvedValue(false);

      const result = await comparePassword(wrongPassword, hashedPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        wrongPassword,
        hashedPassword
      );
      expect(result).toBe(false);
    });

    it("should throw an error when bcrypt compare fails", async () => {
      bcrypt.compare = jest.fn().mockRejectedValue(new Error("Compare error"));

      await expect(comparePassword(password, hashedPassword)).rejects.toThrow();
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    });
  });

  describe("isPasswordValid", () => {
    const passwordErrorMsg = "Passsword should be at least 6 characters long";

    it("should return an empty string when password is exactly 6 characters", () => {
      const password = "im6chr";

      const result = isPasswordValid(password);

      expect(result).toBe("");
    });

    it("should return an empty string when password is more than 6 characters", () => {
      const password = "strongpassword42";

      const result = isPasswordValid(password);

      expect(result).toBe("");
    });

    it("should return an error message when password is empty", () => {
      const password = "";

      const result = isPasswordValid(password);

      expect(result).toBe(passwordErrorMsg);
    });

    it("should return an error message when password is non-empty and less than 6 characters", () => {
      const password = "2weak";

      const result = isPasswordValid(password);

      expect(result).toBe(passwordErrorMsg);
    });
  });

  describe("isPhoneValid", () => {
    const phoneErrorMsg =
      "Phone should be 8 digits long and begin with 6, 8 or 9";

    it("should return an empty string when phone is 8 digits and starts with 6", () => {
      const phone = "61234567";

      const result = isPhoneValid(phone);

      expect(result).toBe("");
    });

    it("should return an empty string when phone is 8 digits and starts with 8", () => {
      const phone = "81234567";

      const result = isPhoneValid(phone);

      expect(result).toBe("");
    });

    it("should return an empty string when phone is 8 digits and starts with 9", () => {
      const phone = "91234567";

      const result = isPhoneValid(phone);

      expect(result).toBe("");
    });

    it("should return an error message when phone is empty", () => {
      const phone = "";

      const result = isPhoneValid(phone);

      expect(result).toBe(phoneErrorMsg);
    });

    it("should return an error message when phone is less than 8 digits", () => {
      const phone = "9876543";

      const result = isPhoneValid(phone);

      expect(result).toBe(phoneErrorMsg);
    });

    it("should return an error message when phone is more than 8 digits", () => {
      const phone = "987654321";

      const result = isPhoneValid(phone);

      expect(result).toBe(phoneErrorMsg);
    });

    it("should return an error message when phone does not start with 6, 8 or 9", () => {
      const phone = "12345678";

      const result = isPhoneValid(phone);

      expect(result).toBe(phoneErrorMsg);
    });

    it("should return an error message when phone is non-numeric", () => {
      const phone = "98abc43";

      const result = isPhoneValid(phone);

      expect(result).toBe(phoneErrorMsg);
    });
  });

  describe("isEmailValid", () => {
    it("should return an empty string when a valid email is provided", () => {
      const email = "test@test.com";

      const result = isEmailValid(email);

      expect(result).toBe("");
    });

    it("should return an error message when email does not contain @", () => {
      const email = "test.com";

      const result = isEmailValid(email);

      expect(result).toBe(emailErrorMsg);
    });

    it("should return an error message when email is empty", () => {
      const email = "";

      const result = isEmailValid(email);

      expect(result).toBe(emailErrorMsg);
    });
  });
});
