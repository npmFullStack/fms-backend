// routes/apRoutes.js
import express from "express";
import { verifyTokenMiddleware } from "../middleware/authMiddlewares.js";
import { getAPRecords, upsertAPRecord } from "../controllers/apController.js";

const router = express.Router();

// 🔐 Apply authentication to all /ap routes
router.use(verifyTokenMiddleware);

// GET /ap → fetch all
router.get("/", getAPRecords);

// PUT /ap/:apId → insert or update
router.put("/:apId", upsertAPRecord);

export default router;
