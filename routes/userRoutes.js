import express from "express";
import {
  addUser,
  getUsers,
  getUserById,
  updateUser
} from "../controllers/userController.js";
import { verifyTokenMiddleware } from "../middleware/authMiddlewares.js";

const router = express.Router();

// User management routes (all protected)
router.get("/", verifyTokenMiddleware, getUsers);
router.post("/", verifyTokenMiddleware, addUser);
router.get("/:id", verifyTokenMiddleware, getUserById);
router.put("/:id", verifyTokenMiddleware, updateUser);

export default router;