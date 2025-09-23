// models/Courier.js
import { pool } from "../db/index.js";

export const findByNumberOrHwb = async query => {
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
