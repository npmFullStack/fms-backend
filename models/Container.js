import { pool } from "../db/index.js";

class Container {
  // Create new container
  static async create(containerData) {
    const result = await pool.query(
      `INSERT INTO containers (shipping_line_id, size, van_number, is_returned)
       VALUES ($1, $2, $3, TRUE)
       RETURNING *`,
      [containerData.shippingLineId, containerData.size, containerData.vanNumber]
    );
    return result.rows[0];
  }

  // Get returned containers for a shipping line (for booking selection)
  static async getReturnedByLine(shippingLineId) {
    const result = await pool.query(
      `SELECT * FROM containers 
       WHERE shipping_line_id = $1 AND is_returned = TRUE 
       ORDER BY created_at DESC`,
      [shippingLineId]
    );
    return result.rows;
  }

  // Get all containers for a shipping line (for management view)
  static async getAllByLine(shippingLineId) {
    const result = await pool.query(
      `SELECT * FROM containers 
       WHERE shipping_line_id = $1 
       ORDER BY created_at DESC`,
      [shippingLineId]
    );
    return result.rows;
  }

  // Get container by ID
  static async findById(id) {
    const result = await pool.query(
      `SELECT * FROM containers WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  }

  // Get available containers for booking
  static async getAvailable(shippingLineId) {
    const result = await pool.query(
      `SELECT id, size, van_number, created_at
       FROM containers
       WHERE shipping_line_id = $1 AND is_returned = TRUE
       ORDER BY size, van_number`,
      [shippingLineId]
    );
    return result.rows;
  }

// Update container information
static async update(id, containerData) {
  const result = await pool.query(
    `UPDATE containers
     SET
       size = COALESCE($1, size),
       van_number = COALESCE($2, van_number),
       is_returned = COALESCE($3, is_returned),
       returned_date = COALESCE($4, returned_date),
       updated_at = NOW()
     WHERE id = $5
     RETURNING *`,
    [
      containerData.size,
      containerData.vanNumber,
      containerData.isReturned,
      containerData.returnedDate,
      id
    ]
  );
  return result.rows[0];
}


  // Delete container
  static async delete(id) {
    await pool.query(`DELETE FROM containers WHERE id = $1`, [id]);
    return { id };
  }
}

export default Container;