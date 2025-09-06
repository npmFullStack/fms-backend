import express from "express";
import {
  createContainer,
  getContainers,
  getContainer,
  updateContainer,
  deleteContainer,
} from "../controllers/containerController.js";
import { verifyTokenMiddleware } from "../middleware/authMiddlewares.js";

const router = express.Router();

router.get("/ship/:shipId", verifyTokenMiddleware, getContainers);
router.get("/:id", verifyTokenMiddleware, getContainer);
router.post("/", verifyTokenMiddleware, createContainer);
router.put("/:id", verifyTokenMiddleware, updateContainer);
router.delete("/:id", verifyTokenMiddleware, deleteContainer);

export default router;
