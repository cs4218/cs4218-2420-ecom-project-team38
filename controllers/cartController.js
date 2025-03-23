import userModel from "../models/userModel.js";

export const addItemCartController = async (req, res) => {
  try {
    let { userId, productId } = req.body;
    if (!userId || !productId) {
      return res.status(400).send({
        success: false,
        message: "User ID and Product ID are required",
      });
    }

    const updatedCart = await userModel.findByIdAndUpdate(
      userId,
      { $push: { cart: productId } },
      { new: true }
    );

    return res.status(200).send({
      success: true,
      message: "Item added into cart Successfully",
      updatedCart,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error adding item into cart",
      error,
    });
  }
};

export const removeItemCartController = async (req, res) => {
  try {
    let { userId, productId } = req.body;
    if (!userId || !productId) {
      return res.status(400).send({
        success: false,
        message: "User ID and Product ID are required",
      });
    }

    const user = await userModel.findById(userId);
    const cart = user.cart;
    const index = cart.indexOf(productId);
    if (index > -1) {
      cart.splice(index, 1);
      user.cart = cart;
      await user.save();
    }

    return res.status(200).send({
      success: true,
      message: "Item removed from cart successfully",
      cart,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error removing item from cart",
      error,
    });
  }
};

export const clearCartController = async (req, res) => {
  try {
    let { userId } = req.body;
    if (!userId) {
      return res.status(400).send({
        success: false,
        message: "User ID is required",
      });
    }

    const updatedCart = await userModel.findByIdAndUpdate(
      userId,
      { $set: { cart: [] } },
      { new: true }
    );

    return res.status(200).send({
      success: true,
      message: "Cart cleared successfully",
      updatedCart,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error clearing cart",
      error,
    });
  }
};
