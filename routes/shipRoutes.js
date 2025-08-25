import express from "express";
import {
    getShips,
    getShip,
    createShip,
    updateShip,
    deleteShip
} from "../controllers/shipController.js";
import { verifyTokenMiddleware } from "../middleware/authMiddlewares.js";

const router = express.Router();

router.get("/", verifyTokenMiddleware, getShips);
router.get("/:id", verifyTokenMiddleware, getShip);
router.post("/", verifyTokenMiddleware, createShip);
router.put("/:id", verifyTokenMiddleware, updateShip);
router.delete("/:id", verifyTokenMiddleware, deleteShip);

export default router;
