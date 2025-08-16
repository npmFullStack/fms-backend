import express from "express";
import {
  getTruckingCompanies,
  getTruckingCompany,
  addTruckingCompany,
  editTruckingCompany,
  toggleStatus,
} from "../controllers/truckingCompanyController.js";
import { verifyTokenMiddleware } from "../middleware/authMiddlewares.js";
import { upload } from "../utils/imageUtils.js";

const router = express.Router();

// Protected routes
router.get("/", verifyTokenMiddleware, getTruckingCompanies);
router.get("/:id", verifyTokenMiddleware, getTruckingCompany);
router.post("/", verifyTokenMiddleware, upload.single("logo"), addTruckingCompany);
router.put("/:id", verifyTokenMiddleware, upload.single("logo"), editTruckingCompany);
router.patch("/:id/toggle-status", verifyTokenMiddleware, toggleStatus);

export default router;