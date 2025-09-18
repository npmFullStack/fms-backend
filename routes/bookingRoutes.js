// routes/bookingRoutes.js - Updated version
import express from "express";
import { verifyTokenMiddleware } from "../middleware/authMiddlewares.js";
import {
  createBooking,
  getBookings,
  getBooking,
  updateBooking,
  deleteBooking,
  getAvailableContainers, // New import
} from "../controllers/bookingController.js";

const router = express.Router();

// All routes are protected
router.use(verifyTokenMiddleware);

// Routes
router.get("/", getBookings);
router.get("/:id", getBooking);
router.post("/", createBooking);
router.patch("/:id", updateBooking);
router.delete("/:id", deleteBooking);

// New route to get available containers for a shipping line
router.get("/available-containers/:shipping_line_id", getAvailableContainers);

export default router;