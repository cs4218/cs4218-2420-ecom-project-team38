import userModel from "../models/userModel.js";
import orderModel from "../models/orderModel.js";

import {
  comparePassword,
  hashPassword,
  isPasswordValid,
  isPhoneValid,
  isEmailValid,
  isDOBValid,
} from "./../helpers/authHelper.js";
import JWT from "jsonwebtoken";

export const registerController = async (req, res) => {
  try {
    const { name, email, password, phone, address, DOB, answer } = req.body;
    //validations
    if (!name) {
      return res.status(400).send({ error: "Name is required" });
    }
    if (!email) {
      return res.status(400).send({ error: "Email is required" });
    }

    const emailValidationResult = isEmailValid(email);
    if (emailValidationResult) {
      return res.status(200).json({
        success: false,
        message: emailValidationResult,
      });
    }

    if (!password) {
      return res.status(400).send({ error: "Password is required" });
    }

    const passwordValidationResult = isPasswordValid(password);
    if (passwordValidationResult) {
      return res.status(200).json({
        success: false,
        message: passwordValidationResult,
      });
    }

    if (!phone) {
      return res.status(400).send({ error: "Phone number is required" });
    }

    const phoneValidationResult = isPhoneValid(phone);
    if (phoneValidationResult) {
      return res.status(200).json({
        success: false,
        message: phoneValidationResult,
      });
    }

    if (!address) {
      return res.status(400).send({ error: "Address is required" });
    }
    if (!DOB) {
      return res.status(400).send({ error: "DOB is required" });
    }

    let formattedDOB = new Date(DOB);
    const DOBValidationResult = isDOBValid(formattedDOB);
    if (DOBValidationResult) {
      return res.status(200).json({
        success: false,
        message: DOBValidationResult,
      });
    }

    if (!answer) {
      return res.status(400).send({ error: "Answer is required" });
    }
    //check user
    const exisitingUser = await userModel.findOne({ email });
    //exisiting user
    if (exisitingUser) {
      return res.status(200).send({
        success: false,
        message: "Already registered! Please login.",
      });
    }

    //register user
    const hashedPassword = await hashPassword(password);
    //save
    const user = await new userModel({
      name,
      email,
      phone,
      address,
      password: hashedPassword,
      DOB: formattedDOB,
      answer,
    }).save();

    res.status(201).send({
      success: true,
      message: "User Registered Successfully",
      user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in registration",
      error,
    });
  }
};

//POST LOGIN
export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    //validation
    if (!email || !password) {
      return res.status(400).send({
        success: false,
        message: "Invalid email or password",
      });
    }
    //check user
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(200).send({
        success: false,
        message: "Invalid email or password",
      });
    }
    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.status(200).send({
        success: false,
        message: "Invalid email or password",
      });
    }
    //token
    const token = await JWT.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.status(200).send({
      success: true,
      message: "Login successfully!",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in login",
      error,
    });
  }
};

//forgotPasswordController

export const forgotPasswordController = async (req, res) => {
  try {
    const { email, answer, newPassword } = req.body;
    if (!email) {
      return res.status(400).send({ message: "Email is required" });
    }

    const emailValidationResult = isEmailValid(email);
    if (emailValidationResult) {
      return res.status(200).json({
        success: false,
        message: emailValidationResult,
      });
    }

    if (!answer) {
      return res.status(400).send({ message: "Answer is required" });
    }
    if (!newPassword) {
      return res.status(400).send({ message: "New password is required" });
    }

    const newPasswordValidationResult = isPasswordValid(newPassword);
    if (newPasswordValidationResult) {
      return res.status(200).json({
        success: false,
        message: newPasswordValidationResult,
      });
    }

    //check
    const user = await userModel.findOne({ email, answer });
    //validation
    if (!user) {
      return res.status(200).send({
        success: false,
        message: "Wrong email or answer",
      });
    }
    const hashed = await hashPassword(newPassword);
    await userModel.findByIdAndUpdate(user._id, { password: hashed });
    res.status(200).send({
      success: true,
      message: "Password Reset Successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Something went wrong",
      error,
    });
  }
};

//test controller
export const testController = (req, res) => {
  try {
    res.send("Protected Routes");
  } catch (error) {
    console.log(error);
    res.send({ error });
  }
};

//update profile
export const updateProfileController = async (req, res) => {
  try {
    let { name, email, password, address, phone } = req.body;
    name = name?.trim();
    password = password?.trim();
    address = address?.trim();
    phone = phone?.trim();

    // name, address and phone are required fields
    if (!name || !address || !phone) {
      return res.json({
        error: "Name, address and phone are required",
      });
    }

    // validate password
    if (password) {
      const passwordValidationResult = isPasswordValid(password);
      if (passwordValidationResult) {
        return res.json({
          error: passwordValidationResult,
        });
      }
    }

    // validate phone
    const phoneValidationResult = isPhoneValid(phone);
    if (phoneValidationResult) {
      return res.json({
        error: phoneValidationResult,
      });
    }

    const user = await userModel.findById(req.user._id);
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    let newHashedPassword, currentHashedPassword;
    if (password) {
      newHashedPassword = await hashPassword(password);
    } else {
      currentHashedPassword = user.password;
    }

    const updatedUser = await userModel.findByIdAndUpdate(
      req.user._id,
      {
        name: name,
        password: newHashedPassword || currentHashedPassword,
        phone: phone,
        address: address,
      },
      { new: true }
    );
    res.status(200).send({
      success: true,
      message: "Profile Updated Successfully",
      updatedUser,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while updating profile",
      error,
    });
  }
};

//orders
export const getOrdersController = async (req, res) => {
  try {
    const orders = await orderModel
      .find({ buyer: req.user._id })
      .populate("products", "-photo")
      .populate("buyer", "name");
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting orders",
      error,
    });
  }
};

//orders
export const getAllOrdersController = async (req, res) => {
  try {
    const orders = await orderModel
      .find({})
      .populate("products", "-photo")
      .populate("buyer", "name")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting all orders",
      error,
    });
  }
};

//order status
export const orderStatusController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const order = await orderModel.findByIdAndUpdate(
      orderId,
      { status },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).send({
        success: false,
        message: "Order not found",
      });
    }

    res.json(order);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while updating order",
      error,
    });
  }
};
