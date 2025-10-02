// routes/bookingRoutes.js 
import express from "express";
import {
  createBooking,
  getBookings,
  getBooking,
  updateBooking,
  deleteBooking,
  getBookingHistory,
  addStatusHistory,
  updateStatusHistoryDate
} from "../controllers/bookingController.js";
import { verifyTokenMiddleware } from "../middleware/authMiddlewares.js";

const router = express.Router();

// Protected routes
router.use(verifyTokenMiddleware);

router.get("/", getBookings);
router.get("/:id", getBooking);
router.post("/", createBooking);
router.put("/:id", updateBooking);
router.patch("/:id", updateBooking);
router.delete("/:id", deleteBooking);

// Booking status history routes
router.get("/:id/history", getBookingHistory);
router.post("/:id/history", addStatusHistory);
router.patch("/history/:historyId", updateStatusHistoryDate);

export default router;