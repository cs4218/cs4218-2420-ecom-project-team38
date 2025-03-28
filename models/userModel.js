import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      type: {},
      required: true,
    },
    answer: {
      type: String,
      required: true,
    },
    DOB: {
      type: Date,
      required: true,
    },
    role: {
      type: Number,
      default: 0,
    },
    cart: [
      {
        type: mongoose.ObjectId,
        ref: "Products",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("users", userSchema);
