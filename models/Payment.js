// models/Payment.js
import { pool } from "../db/index.js";

export const Payment = {
  async create({ booking_id, intent_id, amount, method, currency }) {
    const query = `
      INSERT INTO paymongo_payments 
      (booking_id, paymongo_payment_intent_id, amount, payment_method, currency)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const result = await pool.query(query, [booking_id, intent_id, amount, method, currency]);
    return result.rows[0];
  },

  async updateStatus(intentId, status) {
    const query = `
      UPDATE paymongo_payments
      SET status = $1, updated_at = NOW()
      WHERE paymongo_payment_intent_id = $2
      RETURNING *;
    `;
    const result = await pool.query(query, [status, intentId]);
    return result.rows[0];
  },

  async getByBooking(booking_id) {
    const result = await pool.query(
      `SELECT * FROM paymongo_payments WHERE booking_id = $1 ORDER BY created_at DESC`,
      [booking_id]
    );
    return result.rows;
  },
};
