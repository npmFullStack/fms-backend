// models/Ship.js
import { pool } from "../db/index.js";

// Create a ship
export const createShip = async ({
    shipName,
    vesselNumber,
    shippingLineId
}) => {
    // Return ALL ship data, not just id
    const shipRes = await pool.query(
        `INSERT INTO ships (ship_name, vessel_number, shipping_line_id)
    VALUES ($1, $2, $3)
    RETURNING id, ship_name, vessel_number, shipping_line_id, created_at,
    updated_at`,
        [shipName, vesselNumber || null, shippingLineId]
    );

    return shipRes.rows[0]; 
};
// Get all ships
export const getAllShips = async () => {
    const result = await pool.query(`
    SELECT
      s.id,
      s.ship_name,
      s.vessel_number,
      s.shipping_line_id,
      sl.name AS shipping_line_name,
      sd.remarks
    FROM ships s
    JOIN shipping_lines sl ON s.shipping_line_id = sl.id
    LEFT JOIN ship_details sd ON s.id = sd.ship_id
    ORDER BY s.created_at DESC
  `);

    return result.rows;
};

// Get single ship
export const getShipById = async id => {
    const result = await pool.query(
        `
    SELECT
      s.id,
      s.ship_name,
      s.vessel_number,
      s.shipping_line_id,
      sl.name AS shipping_line_name,
      sd.remarks
    FROM ships s
    JOIN shipping_lines sl ON s.shipping_line_id = sl.id
    LEFT JOIN ship_details sd ON s.id = sd.ship_id
    WHERE s.id = $1
  `,
        [id]
    );

    return result.rows[0];
};

// Update ship (shipName + vesselNumber )
export const updateShip = async (id, { shipName, vesselNumber }) => {
    await pool.query(
        `UPDATE ships
     SET ship_name = $1, vessel_number = $2, updated_at = NOW()
     WHERE id = $3`,
        [shipName || null, vesselNumber || null, id]
    );

    return { id };
};

// Delete ship
export const deleteShip = async id => {
    await pool.query(`DELETE FROM ships WHERE id = $1`, [id]);
    return { id };
};
