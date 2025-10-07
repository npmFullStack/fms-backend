// routes/apRoutes.js
import express from "express";
import {
    getAllAP,
    getAPById,
    getAPByBookingId,
    getAPByBookingNumber,
    createAP,
    addFreight,
    updateFreight,
    addTrucking,
    updateTrucking,
    addPortCharge,
    updatePortCharge,
    addMiscCharge,
    updateMiscCharge
} from "../controllers/apController.js";
import { verifyTokenMiddleware } from "../middleware/authMiddlewares.js";

const router = express.Router();

// Apply authentication to all routes
router.use(verifyTokenMiddleware);

// GET routes
router.get("/", getAllAP);
router.get("/:id", getAPById);
router.get("/booking/:bookingId", getAPByBookingId);
router.get("/booking-number/:bookingNumber", getAPByBookingNumber);

// POST routes
router.post("/", createAP);
router.post("/:apId/freight", addFreight);
router.post("/:apId/trucking", addTrucking);
router.post("/:apId/port-charges", addPortCharge);
router.post("/:apId/misc-charges", addMiscCharge);

// PUT routes
router.put("/freight/:freightId", updateFreight);
router.put("/trucking/:truckingId", updateTrucking);
router.put("/port-charges/:portChargeId", updatePortCharge);
router.put("/misc-charges/:miscChargeId", updateMiscCharge);

export default router;