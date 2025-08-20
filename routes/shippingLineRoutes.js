import express from "express";
import {
  getShippingLines,
  getShippingLine,
  addShippingLine,
  editShippingLine,
  deleteShippingLine
} from "../controllers/shippingLineController.js";
import { verifyTokenMiddleware } from "../middleware/authMiddlewares.js";
import { upload } from "../utils/imageUtils.js";

const router = express.Router();

// Protected routes
router.get("/", verifyTokenMiddleware, getShippingLines);
router.get("/:id", verifyTokenMiddleware, getShippingLine);
router.post("/", verifyTokenMiddleware, upload.single("logo"), addShippingLine);
router.put("/:id", verifyTokenMiddleware, upload.single("logo"), editShippingLine);
router.delete("/:id", verifyTokenMiddleware, deleteShippingLine);

export default router;