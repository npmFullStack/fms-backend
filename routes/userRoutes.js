// routes/userRoutes.js
import express from "express";
import {
  addUser,
  getUsers,
  getUserById,
  updateUser
} from "../controllers/userController.js";
import { verifyTokenMiddleware } from "../middleware/authMiddlewares.js";
import { upload } from "../utils/imageUtils.js";

const router = express.Router();

// User management routes (all protected)
router.get("/", verifyTokenMiddleware, getUsers);
router.post("/", verifyTokenMiddleware, upload.single('profile_picture'), addUser);
router.get("/:id", verifyTokenMiddleware, getUserById);
router.put("/:id", verifyTokenMiddleware, upload.single('profile_picture'), updateUser);

export default router;