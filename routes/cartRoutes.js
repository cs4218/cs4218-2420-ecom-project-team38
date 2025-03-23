import express from "express";
import {
  addItemCartController,
  removeItemCartController,
  clearCartController
} from "../controllers/cartController.js";

const router = express.Router();

router.post("/add-item", addItemCartController);
router.post("/remove-item", removeItemCartController);
router.post("/clear-cart", clearCartController);

export default router;
