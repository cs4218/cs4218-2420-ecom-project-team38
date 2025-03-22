import userModel from "../models/userModel.js";

export const addItemCartController = async (req, res) => {
  try {
    let { userId, productId } = req.body;
    if (!userId || !productId) {
      return res.json({
        error: "User and Product ID are required",
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
      return res.json({
        error: "User ID and Product ID are required",
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
      updatedCart,
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
