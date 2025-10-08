// routes/apRoutes.js
import express from "express";
import { verifyTokenMiddleware } from "../middleware/authMiddlewares.js";
import {
    getAPSummaries,
    getAPById,
    updateAP,
    createMissingAPRecords,
    getAPByBookingId
} from "../controllers/apController.js";

const router = express.Router();

// Get all AP summaries
router.get("/", verifyTokenMiddleware, getAPSummaries);

// Get AP by ID
router.get("/:id", verifyTokenMiddleware, getAPById);

// Update AP record
router.put("/:id", verifyTokenMiddleware, updateAP);

// Get AP by booking ID
router.get("/booking/:bookingId", verifyTokenMiddleware, getAPByBookingId);

// Create missing AP records (admin only - can add role check if needed)
router.post("/create-missing", verifyTokenMiddleware, createMissingAPRecords);

export default router;
