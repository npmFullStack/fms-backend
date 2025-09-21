import express from "express";
import {
  createBooking,
  getBookings,
  getBooking,
  updateBooking,
  deleteBooking,
  getAvailableContainers,
  searchBookingPublic, // new
} from "../controllers/bookingController.js";
import { verifyTokenMiddleware } from "../middleware/authMiddlewares.js";

const router = express.Router();

// 🚨 Public route (no verifyTokenMiddleware)
router.get("/public/search/:query", searchBookingPublic);

// ✅ Protected routes
router.use(verifyTokenMiddleware);

router.get("/", getBookings);
router.get("/:id", getBooking);
router.post("/", createBooking);
router.patch("/:id", updateBooking);
router.delete("/:id", deleteBooking);
router.get("/available-containers/:shipping_line_id", getAvailableContainers);

export default router;
