// routes/courierRoutes.js
import express from "express";
import { searchBookingPublic } from "../controllers/courierController.js";

const router = express.Router();

// Public route (no authentication required)
router.get("/public/search/:query", searchBookingPublic);

export default router;
