import express from "express";
import {
    registerUser,
    loginUser,
    getProfile,
    uploadProfilePicture,
    fetchUsers
} from "../controllers/authController.js";
import { verifyTokenMiddleware } from "../middleware/authMiddlewares.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

// ✅ Protected route example
router.get("/profile", verifyTokenMiddleware, getProfile);
router.get("/users", verifyTokenMiddleware, fetchUsers);
router.post("/profile-picture", verifyTokenMiddleware, uploadProfilePicture);

export default router;
