import { pool } from "../db/index.js";

// 🔹 Find booking by number or HWB
export const findByNumberOrHwb = async (query) => {
  try {
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
  } catch (error) {
    console.error("Database query error:", error);
    throw new Error("Database query failed");
  }
};

// 🔹 Update booking status + log history
export const updateStatusById = async (id, status) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1) Update booking status
    const bookingResult = await client.query(
      `
      UPDATE bookings
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *;
      `,
      [status, id]
    );

    const booking = bookingResult.rows[0];
    if (!booking) {
      await client.query("ROLLBACK");
      return null;
    }

    // 2) Insert into history
    await client.query(
      `
      INSERT INTO booking_status_history (booking_id, status, status_date)
      VALUES ($1, $2, NOW());
      `,
      [id, status]
    );

    await client.query("COMMIT");
    return booking;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Database update error:", error);
    throw new Error("Database update failed");
  } finally {
    client.release();
  }
};

// 🔹 Get booking history
export const getStatusHistory = async (bookingId) => {
  try {
    const result = await pool.query(
      `
      SELECT status, status_date
      FROM booking_status_history
      WHERE booking_id = $1
      ORDER BY status_date ASC;
      `,
      [bookingId]
    );
    return result.rows;
  } catch (error) {
    console.error("Database query error (history):", error);
    throw new Error("Database query failed");
  }
};
