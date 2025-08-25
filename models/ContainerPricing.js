import { pool } from "../db/index.js";

export const createPricing = async ({ shipping_route_id, container_type, price, valid_from, valid_to }) => {
  const result = await pool.query(
    `INSERT INTO container_pricing (shipping_route_id, container_type, price, valid_from, valid_to)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [shipping_route_id, container_type, price, valid_from || new Date(), valid_to || null]
  );
  return result.rows[0];
};

export const getPricingByRoute = async (shipping_route_id) => {
  const result = await pool.query(
    `SELECT * FROM container_pricing WHERE shipping_route_id = $1 AND is_active = TRUE ORDER BY created_at DESC`,
    [shipping_route_id]
  );
  return result.rows;
};
