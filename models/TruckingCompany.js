import { pool } from "../db/index.js";

class TruckingCompany {
  // Get all trucking companies
  static async getAll() {
    const result = await pool.query(
      `SELECT * FROM trucking_companies ORDER BY name`
    );
    return result.rows;
  }

  // Get trucking company by ID
  static async findById(id) {
    const result = await pool.query(
      `SELECT * FROM trucking_companies WHERE id = $1`, 
      [id]
    );
    return result.rows[0];
  }

  // Create new trucking company
  static async create(id, name, logoUrl = null) {
    const result = await pool.query(
      `INSERT INTO trucking_companies (id, name, logo_url)
       VALUES ($1, $2, $3) RETURNING *`,
      [id, name, logoUrl]
    );
    return result.rows[0];
  }

  // Update trucking company
  static async update(id, name, logoUrl = null) {
    const result = await pool.query(
      `UPDATE trucking_companies
       SET name = $1, logo_url = $2, updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [name, logoUrl, id]
    );
    return result.rows[0];
  }

  // Delete trucking company
  static async delete(id) {
    const result = await pool.query(
      `DELETE FROM trucking_companies WHERE id = $1`, 
      [id]
    );
    return result.rowCount > 0;
  }

  // Get success bookings count
  static async getSuccessBookings(id) {
    const result = await pool.query(
      `SELECT COUNT(*) AS total_success
       FROM bookings b
       JOIN booking_truck_assignments bta ON b.id = bta.booking_id
       WHERE (bta.pickup_trucker_id = $1 OR bta.delivery_trucker_id = $1)
         AND b.status = 'DELIVERED'`,
      [id]
    );
    return parseInt(result.rows[0].total_success, 10);
  }
}

export default TruckingCompany;