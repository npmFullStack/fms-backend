import express from "express";
import { verifyTokenMiddleware } from "../middleware/authMiddlewares.js";
import {
  createBooking,
  getBookings,
  getBooking,
  updateBooking,
  deleteBooking,
} from "../controllers/bookingController.js";

const router = express.Router();

// All routes are protected
router.use(verifyTokenMiddleware);

// Routes
router.get("/", getBookings);
router.get("/:id", getBooking);
router.post("/", createBooking);
router.put("/:id", updateBooking);
router.delete("/:id", deleteBooking);

export default router;
