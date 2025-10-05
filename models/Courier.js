import { pool } from "../db/index.js";

class Courier {
  // Find booking by booking number or HWB number
  static async findByNumberOrHwb(query) {
    const result = await pool.query(
      `
      SELECT   
        b.*,  
        sl.name AS shipping_line_name,  
        s.vessel_number AS ship_vessel_number,  
        s.ship_name  
      FROM bookings b  
      LEFT JOIN shipping_lines sl ON b.shipping_line_id = sl.id  
      LEFT JOIN ships s ON b.ship_id = s.id  
      WHERE UPPER(TRIM(b.booking_number)) = UPPER(TRIM($1))   
         OR UPPER(TRIM(b.hwb_number)) = UPPER(TRIM($1))  
      LIMIT 1
      `,
      [query]
    );
    return result.rows[0] || null;
  }

  // Update booking status
  static async updateStatus(id, status) {
    // Update booking status
    const bookingResult = await pool.query(
      `UPDATE bookings
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    const booking = bookingResult.rows[0];
    if (!booking) return null;

    // Log status history
    await pool.query(
      `INSERT INTO booking_status_history (booking_id, status, status_date)
       VALUES ($1, $2, NOW())`,
      [id, status]
    );

    return booking;
  }

  // Get booking status history
  static async getStatusHistory(bookingId) {
    const result = await pool.query(
      `SELECT status, status_date
       FROM booking_status_history
       WHERE booking_id = $1
       ORDER BY status_date ASC`,
      [bookingId]
    );
    return result.rows;
  }
}

export default Courier;