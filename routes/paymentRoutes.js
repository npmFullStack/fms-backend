// routes/paymentRoutes.js
import express from "express";
import { createPayment, getPaymentsByBooking } from "../controllers/paymentController.js";
import { verifyTokenMiddleware } from "../middleware/authMiddlewares.js";

const router = express.Router();

router.post("/", verifyTokenMiddleware, createPayment);

router.get("/:booking_id", verifyTokenMiddleware, getPaymentsByBooking);

export default router;
