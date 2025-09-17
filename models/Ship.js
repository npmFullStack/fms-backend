// models/Ship.js
import { pool } from "../db/index.js";

// Create a ship
export const createShip = async ({ shipName, vesselNumber, shippingLineId, remarks }) => {
  // 1) Create ship
  const shipRes = await pool.query(
    `INSERT INTO ships (ship_name, vessel_number, shipping_line_id)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [shipName, vesselNumber || null, shippingLineId]
  );
  const shipId = shipRes.rows[0].id;

  // 2) Ship details (remarks optional)
  await pool.query(
    `INSERT INTO ship_details (ship_id, remarks)
     VALUES ($1, $2)
     ON CONFLICT (ship_id) DO NOTHING`,
    [shipId, remarks || null]
  );

  return { id: shipId };
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
export const getShipById = async (id) => {
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

// Update ship (shipName + vesselNumber + remarks)
export const updateShip = async (id, { shipName, vesselNumber, remarks }) => {
  await pool.query(
    `UPDATE ships
     SET ship_name = $1, vessel_number = $2, updated_at = NOW()
     WHERE id = $3`,
    [shipName || null, vesselNumber || null, id]
  );

  await pool.query(
    `UPDATE ship_details
     SET remarks = $1, updated_at = NOW()
     WHERE ship_id = $2`,
    [remarks || null, id]
  );

  return { id };
};

// Delete ship
export const deleteShip = async (id) => {
  await pool.query(`DELETE FROM ships WHERE id = $1`, [id]);
  return { id };
};
