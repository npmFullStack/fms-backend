import express from "express";
import {
  registerUser,
  loginUser,
  getProfile,
  uploadProfilePicture,
forgotPasswordController,
  resetPasswordController
} from "../controllers/authController.js";
import { verifyTokenMiddleware } from "../middleware/authMiddlewares.js";

const router = express.Router();

// Authentication routes only
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", verifyTokenMiddleware, getProfile);
router.post("/profile-picture", verifyTokenMiddleware, uploadProfilePicture);
router.post("/forgot-password", forgotPasswordController);
router.post("/reset-password", resetPasswordController);


export default router;