import express from "express";
import { 
  searchBookingPublic, 
  updateBookingStatus,
  addIncidentReport,
} from "../controllers/courierController.js";
import { upload } from "../utils/imageUtils.js";

const router = express.Router();

// Public search route
router.get("/public/search/:query", searchBookingPublic);

// Update booking status
router.put("/:id/status", updateBookingStatus);

router.post("/incident", upload.single("image"), addIncidentReport);

export default router;