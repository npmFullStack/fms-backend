// controllers/notificationController
import Notification from "../models/Notification.js";

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await Notification.findByUserId(userId);
    res.json(notifications);
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await Notification.getUnreadCount(userId);
    res.json({ count });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({ error: "Failed to fetch unread count" });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const notification = await Notification.markAsRead(id, userId);
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }
    
    res.json(notification);
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await Notification.markAllAsRead(userId);
    res.json({ message: "All notifications marked as read", count: notifications.length });
  } catch (error) {
    console.error("Mark all as read error:", error);
    res.status(500).json({ error: "Failed to mark all notifications as read" });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const notification = await Notification.delete(id, userId);
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }
    
    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({ error: "Failed to delete notification" });
  }
};