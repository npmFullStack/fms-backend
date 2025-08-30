// routes/truckRoutes.js
import express from "express";
import { verifyTokenMiddleware } from "../middleware/authMiddlewares.js";
import {
  getTrucks,
  getTruck,
  createTruck,
  updateTruck,
  deleteTruck
} from "../controllers/truckController.js";

const router = express.Router();

router.get("/", verifyTokenMiddleware, getTrucks);
router.get("/:id", verifyTokenMiddleware, getTruck);
router.post("/", verifyTokenMiddleware, createTruck);
router.put("/:id", verifyTokenMiddleware, updateTruck);
router.delete("/:id", verifyTokenMiddleware, deleteTruck);

export default router;
