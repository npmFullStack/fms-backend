// routes/apRoutes.js
import express from "express";
import { verifyTokenMiddleware } from "../middleware/authMiddlewares.js";
import {
    getAPSummaries,
    getAPById,
    updateAP,
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


export default router;
