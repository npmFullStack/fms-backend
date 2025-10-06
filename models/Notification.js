// models/Notification
// models/Notification.js
import { pool } from "../db/index.js";

class Notification {
  static async create(notificationData) {
    const {
      user_id,
      title,
      message,
      type,
      entity_type,
      entity_id
    } = notificationData;

    const query = `
      INSERT INTO notifications (user_id, title, message, type, entity_type, entity_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [user_id, title, message, type, entity_type, entity_id];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // ✅ Add this bulk insert method
  static async createBulk(notifications) {
    if (notifications.length === 0) return [];

    const values = [];
    const placeholders = notifications.map((n, i) => {
      const idx = i * 6;
      values.push(
        n.user_id,
        n.title,
        n.message,
        n.type,
        n.entity_type || null,
        n.entity_id || null
      );
      return `($${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4}, $${idx + 5}, $${idx + 6})`;
    });

    const query = `
      INSERT INTO notifications (user_id, title, message, type, entity_type, entity_id)
      VALUES ${placeholders.join(", ")}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async findByUserId(userId, limit = 50) {
    const query = `
      SELECT * FROM notifications 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `;
    const result = await pool.query(query, [userId, limit]);
    return result.rows;
  }

  static async markAsRead(notificationId, userId) {
    const query = `
      UPDATE notifications 
      SET is_read = true, updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [notificationId, userId]);
    return result.rows[0];
  }

  static async markAllAsRead(userId) {
    const query = `
      UPDATE notifications 
      SET is_read = true, updated_at = NOW()
      WHERE user_id = $1 AND is_read = false
      RETURNING *
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  static async getUnreadCount(userId) {
    const query = `
      SELECT COUNT(*) FROM notifications 
      WHERE user_id = $1 AND is_read = false
    `;
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }

  static async delete(notificationId, userId) {
    const query = `
      DELETE FROM notifications 
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [notificationId, userId]);
    return result.rows[0];
  }
}

export default Notification;