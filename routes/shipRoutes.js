import express from "express";
import {
    getShips,
    getShip,
    getShipsByLine,   // ✅ import your new controller
    createShip,
    updateShip,
    deleteShip
} from "../controllers/shipController.js";
import { verifyTokenMiddleware } from "../middleware/authMiddlewares.js";

const router = express.Router();

router.get("/", verifyTokenMiddleware, getShips);

// ✅ must come BEFORE "/:id"
router.get("/by-line/:lineId", verifyTokenMiddleware, getShipsByLine);

router.get("/:id", verifyTokenMiddleware, getShip);
router.post("/", verifyTokenMiddleware, createShip);
router.put("/:id", verifyTokenMiddleware, updateShip);
router.delete("/:id", verifyTokenMiddleware, deleteShip);

export default router;
