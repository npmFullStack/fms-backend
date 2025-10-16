import { pool } from "../db/index.js";

class Incident {
  // Get all incidents
  static async getAll() {
    const result = await pool.query(`
      SELECT i.*, b.booking_number 
      FROM incidents i
      LEFT JOIN bookings b ON i.booking_id = b.id
      ORDER BY i.created_at DESC
    `);
    return result.rows;
  }

  // Get incident by ID
  static async findById(id) {
    const result = await pool.query(`
      SELECT i.*, b.booking_number 
      FROM incidents i
      LEFT JOIN bookings b ON i.booking_id = b.id
      WHERE i.id = $1
    `, [id]);
    return result.rows[0];
  }

  // Get incidents by booking ID
  static async findByBookingId(bookingId) {
    const result = await pool.query(`
      SELECT * FROM incidents 
      WHERE booking_id = $1
      ORDER BY created_at DESC
    `, [bookingId]);
    return result.rows;
  }

  // Create new incident
  static async create(id, imageUrl, type, description, totalCost, bookingId) {
    const result = await pool.query(`
      INSERT INTO incidents (id, image_url, type, description, total_cost, booking_id)
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *
    `, [id, imageUrl, type, description, totalCost, bookingId]);
    return result.rows[0];
  }

  // Update incident
  static async update(id, imageUrl, type, description, totalCost, bookingId) {
    const result = await pool.query(`
      UPDATE incidents 
      SET image_url = $1, type = $2, description = $3, 
          total_cost = $4, booking_id = $5, updated_at = NOW()
      WHERE id = $6 
      RETURNING *
    `, [imageUrl, type, description, totalCost, bookingId, id]);
    return result.rows[0];
  }

  // Delete incident
  static async delete(id) {
    const result = await pool.query(
      'DELETE FROM incidents WHERE id = $1',
      [id]
    );
    return result.rowCount > 0;
  }
}

export default Incident;