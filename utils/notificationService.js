import Notification from "../models/Notification.js";
import { pool } from "../db/index.js";

/**
 * 🧍 Get the full name of a user by their ID
 * @param {string} userId
 * @returns {Promise<string>} e.g. "John Doe"
 */
export const getUserFullName = async (userId) => {
  try {
    const result = await pool.query(
      `SELECT first_name, last_name FROM user_details WHERE user_id = $1`,
      [userId]
    );
    if (result.rows[0]) {
      const { first_name, last_name } = result.rows[0];
      return `${first_name} ${last_name}`;
    }
    return "Someone";
  } catch (error) {
    console.error("❌ getUserFullName error:", error);
    return "Someone";
  }
};

/**
 * 🕒 Format a timestamp into "x minutes ago", "just now", etc.
 * @param {string|Date} timestamp
 * @returns {string}
 */
export const formatTimeAgo = (timestamp) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now - time;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? "s" : ""} ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? "s" : ""} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;

  // fallback: display date
  return time.toLocaleString();
};

/**
 * Notify all users with a specific role
 */
export const notifyUsersByRole = async (role, payload) => {
  try {
    const result = await pool.query(
      `SELECT id FROM users WHERE role = $1 AND is_active = true`,
      [role]
    );
    const users = result.rows;
    console.log(`📬 Sending notifications to ${users.length} "${role}" user(s)`);

    if (users.length === 0) return;

    const notifications = users.map((user) => ({
      user_id: user.id,
      ...payload,
    }));

    await Notification.createBulk(notifications);
    console.log(`✅ Sent notification to ${users.length} user(s) with role "${role}"`);
  } catch (error) {
    console.error("❌ notifyUsersByRole error:", error);
  }
};

/**
 * Notify a single user
 */
export const notifyUser = async (userId, payload) => {
  try {
    await Notification.create({
      user_id: userId,
      ...payload,
    });
    console.log(`✅ Notification sent to user ${userId}`);
  } catch (error) {
    console.error("❌ notifyUser error:", error);
  }
};

/**
 * ✅ Notify multiple roles at once
 */
export const notifyMultipleRoles = async (roles, payload) => {
  try {
    for (const role of roles) {
      await notifyUsersByRole(role, payload);
    }
    console.log(`📨 Notifications sent to multiple roles: ${roles.join(", ")}`);
  } catch (error) {
    console.error("❌ notifyMultipleRoles error:", error);
  }
};
