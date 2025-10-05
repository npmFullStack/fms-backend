import { pool } from "../db/index.js";

class ShippingLine {
  // Get all shipping lines
  static async getAll() {
    const result = await pool.query(
      `SELECT * FROM shipping_lines ORDER BY name`
    );
    return result.rows;
  }

  // Get shipping line by ID
  static async findById(id) {
    const result = await pool.query(
      `SELECT * FROM shipping_lines WHERE id = $1`, 
      [id]
    );
    return result.rows[0];
  }

  // Create new shipping line
  static async create(id, name, logoUrl = null) {
    const result = await pool.query(
      `INSERT INTO shipping_lines (id, name, logo_url)
       VALUES ($1, $2, $3) RETURNING *`,
      [id, name, logoUrl]
    );
    return result.rows[0];
  }

  // Update shipping line
  static async update(id, name, logoUrl = null) {
    const result = await pool.query(
      `UPDATE shipping_lines
       SET name = $1, logo_url = $2, updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [name, logoUrl, id]
    );
    return result.rows[0];
  }

  // Delete shipping line
  static async delete(id) {
    const result = await pool.query(
      `DELETE FROM shipping_lines WHERE id = $1`, 
      [id]
    );
    return result.rowCount > 0;
  }

  // Get success bookings count
  static async getSuccessBookings(id) {
    const result = await pool.query(
      `SELECT COUNT(*) AS total_success
       FROM bookings 
       WHERE shipping_line_id = $1 AND status = 'DELIVERED'`,
      [id]
    );
    return parseInt(result.rows[0].total_success, 10);
  }
}

export default ShippingLine;