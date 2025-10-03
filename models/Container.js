// models/Container.js
import { pool } from "../db/index.js";

// Create container
export const createContainer = async ({ shippingLineId, size, vanNumber }) => {
  const result = await pool.query(
    `INSERT INTO containers (shipping_line_id, size, van_number, is_returned)
     VALUES ($1, $2, $3, TRUE)
     RETURNING *`,
    [shippingLineId, size, vanNumber]
  );
  return result.rows[0];
};

// Get all containers for a shipping line WHERE is_returned = TRUE (for booking selection)
export const getContainersByLine = async shippingLineId => {
  const result = await pool.query(
    `SELECT * FROM containers 
     WHERE shipping_line_id = $1 AND is_returned = TRUE 
     ORDER BY created_at DESC`,
    [shippingLineId]
  );
  return result.rows;
};

// Get ALL containers for a shipping line (for management/table view)
export const getAllContainersByLine = async shippingLineId => {
  const result = await pool.query(
    `SELECT * FROM containers 
     WHERE shipping_line_id = $1 
     ORDER BY created_at DESC`,
    [shippingLineId]
  );
  return result.rows;
};

// Get container by id
export const getContainerById = async id => {
  const result = await pool.query(`SELECT * FROM containers WHERE id = $1`, [
    id
  ]);
  return result.rows[0];
};

export const getAvailableContainer = async shipping_line_id => {
  const result = await pool.query(
    `SELECT id, size, van_number, created_at
     FROM containers
     WHERE shipping_line_id = $1 AND is_returned = TRUE
     ORDER BY size, van_number`,
    [shipping_line_id]
  );
  return result.rows;
};

// Update container
export const updateContainer = async (id, { size, vanNumber, isReturned }) => {
  const result = await pool.query(
    `UPDATE containers  
     SET 
       size = COALESCE($1, size),
       van_number = COALESCE($2, van_number),
       is_returned = COALESCE($3, is_returned),
       updated_at = NOW()
     WHERE id = $4 RETURNING *`,
    [size ?? null, vanNumber ?? null, isReturned ?? null, id]
  );
  return result.rows[0];
};



// Delete container
export const deleteContainer = async id => {
  await pool.query(`DELETE FROM containers WHERE id = $1`, [id]);
  return { id };
};