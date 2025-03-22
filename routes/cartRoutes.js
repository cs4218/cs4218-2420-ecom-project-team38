import express from "express";
import {
  addItemCartController,
  removeItemCartController,
} from "../controllers/cartController.js";

const router = express.Router();

router.post("/add-item", addItemCartController);
router.post("/remove-item", removeItemCartController);

export default router;
