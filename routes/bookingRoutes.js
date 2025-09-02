import express from "express";
import { verifyTokenMiddleware } from "../middleware/authMiddlewares.js";
import {
  createBooking,
  getBookings,
  getBooking,
  updateBooking,
  deleteBooking,
  getCustomerBookings,
  updateBookingStatus
} from "../controllers/bookingController.js";

const router = express.Router();

// All routes are protected
router.use(verifyTokenMiddleware);

router.get("/", getBookings);
router.get("/customer/:customerId", getCustomerBookings);
router.get("/:id", getBooking);
router.post("/", createBooking);
router.put("/:id", updateBooking);
router.patch("/:id/status", updateBookingStatus);
router.delete("/:id", deleteBooking);

export default router;