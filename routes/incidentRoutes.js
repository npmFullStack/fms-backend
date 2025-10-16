import express from "express";
import {
  getIncidents,
  getIncident,
  getIncidentsByBooking,
  addIncident,
  editIncident,
  deleteIncident
} from "../controllers/incidentController.js";

import { verifyTokenMiddleware } from "../middleware/authMiddlewares.js";
import { upload } from "../utils/imageUtils.js";

const router = express.Router();

// Protected routes
router.get("/", verifyTokenMiddleware, getIncidents);
router.get("/booking/:bookingId", verifyTokenMiddleware, getIncidentsByBooking);
router.get("/:id", verifyTokenMiddleware, getIncident);
router.post("/", verifyTokenMiddleware, upload.single("image"), addIncident);
router.put("/:id", verifyTokenMiddleware, upload.single("image"), editIncident);
router.delete("/:id", verifyTokenMiddleware, deleteIncident);

export default router;