import { pool } from "../db/index.js";

class PasswordReset {
  // Create new password reset token for user
  static async create(userId, hashedToken, expiresAt) {
    return await pool.query(
      `INSERT INTO password_resets (user_id, token, expires_at)
       VALUES ($1, $2, $3) RETURNING *`,
      [userId, hashedToken, expiresAt]
    );
  }

  // Find valid reset token that is unused and not expired
  static async findValid(token) {
    return await pool.query(
      `SELECT * FROM password_resets WHERE token = $1 AND used = FALSE AND expires_at > NOW()`,
      [token]
    );
  }

  // Mark reset token as used to prevent reuse
  static async markUsed(id) {
    return await pool.query(`UPDATE password_resets SET used = TRUE WHERE id = $1`, [id]);
  }
}

export default PasswordReset;