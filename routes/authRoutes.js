import express from "express";
import {
    registerUser,
    loginUser,
    getProfile
} from "../controllers/authController.js";
import { verifyTokenMiddleware } from "../middleware/authMiddlewares.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

// ✅ Protected route example
router.get("/profile", verifyTokenMiddleware, getProfile);

export default router;
