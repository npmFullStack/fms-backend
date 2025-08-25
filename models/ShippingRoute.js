import { pool } from "../db/index.js";

export const createRoute = async ({ ship_id, origin, destination }) => {
  const result = await pool.query(
    `INSERT INTO shipping_routes (ship_id, origin, destination)
     VALUES ($1, $2, $3) RETURNING *`,
    [ship_id, origin, destination]
  );
  return result.rows[0];
};

export const getRoutesByShip = async (ship_id) => {
  const result = await pool.query(
    `SELECT * FROM shipping_routes WHERE ship_id = $1 ORDER BY created_at DESC`,
    [ship_id]
  );
  return result.rows;
};
