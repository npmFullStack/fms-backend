import express from "express";
import { searchBookingPublic, updateBookingStatus } from "../controllers/courierController.js";

const router = express.Router();

// Public search route
router.get("/public/search/:query", searchBookingPublic);

// Update booking status
router.put("/:id/status", updateBookingStatus);

export default router;
