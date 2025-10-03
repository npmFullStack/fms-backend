// models/ShippingLine
import { pool } from "../db/index.js";

export const getAllShippingLines = async () => {
    return await pool.query(
        `SELECT * FROM shipping_lines
     ORDER BY name`
    );
};

export const getShippingLineById = async id => {
    return await pool.query(`SELECT * FROM shipping_lines WHERE id = $1`, [id]);
};

export const createShippingLine = async (id, name, logoUrl) => {
    return await pool.query(
        `INSERT INTO shipping_lines (id, name, logo_url)
     VALUES ($1, $2, $3)`,
        [id, name, logoUrl || null]
    );
};

export const updateShippingLine = async (id, name, logoUrl) => {
    return await pool.query(
        `UPDATE shipping_lines
     SET name = $1,
         logo_url = $2,
         updated_at = NOW()
     WHERE id = $3`,
        [name, logoUrl || null, id]
    );
};

export const deleteShippingLineById = async id => {
    return await pool.query(`DELETE FROM shipping_lines WHERE id = $1`, [id]);
};

export const getSuccessBookingsByShippingLine = async shippingLineId => {
    return await pool.query(
        `
    SELECT COUNT(*) AS total_success
    FROM bookings
    WHERE shipping_line_id = $1
      AND status = 'DELIVERED'
    `,
        [shippingLineId]
    );
};
