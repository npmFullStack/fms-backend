import express from "express";
import {
  createBooking,
  getBookings,
  getBooking,
  updateBooking,
  deleteBooking,
  searchBookingPublic, // new
} from "../controllers/bookingController.js";
import { verifyTokenMiddleware } from "../middleware/authMiddlewares.js";

const router = express.Router();

// ✅ Protected routes
router.use(verifyTokenMiddleware);

router.get("/", getBookings);
router.get("/:id", getBooking);
router.post("/", createBooking);
router.patch("/:id", updateBooking);
router.delete("/:id", deleteBooking);


export default router;
