import { pool } from "../db/index.js";

export const createPasswordReset = async (userId, hashedToken, expiresAt) => {
  return await pool.query(
    `INSERT INTO password_resets (user_id, token, expires_at)
     VALUES ($1, $2, $3) RETURNING *`,
    [userId, hashedToken, expiresAt]
  );
};

export const findValidReset = async (token) => {
  return await pool.query(
    `SELECT * FROM password_resets WHERE token = $1 AND used = FALSE AND expires_at > NOW()`,
    [token]
  );
};

export const markResetUsed = async (id) => {
  return await pool.query(`UPDATE password_resets SET used = TRUE WHERE id = $1`, [id]);
};
