import express from "express";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from "../controllers/notificationController.js";
import { verifyTokenMiddleware } from "../middleware/authMiddlewares.js";

const router = express.Router();

router.get("/", verifyTokenMiddleware, getNotifications);
router.get("/unread-count", verifyTokenMiddleware, getUnreadCount);
router.patch("/:id/read", verifyTokenMiddleware, markAsRead);
router.patch("/mark-all-read", verifyTokenMiddleware, markAllAsRead);
router.delete("/:id", verifyTokenMiddleware, deleteNotification);

export default router;