import { pool } from "../db/index.js";

class Truck {
  // Create new truck
  static async create(truckData) {
    const result = await pool.query(
      `INSERT INTO trucks (name, plate_number, trucking_company_id)
       VALUES ($1, $2, $3)
       RETURNING id, name, plate_number, trucking_company_id, created_at, updated_at`,
      [truckData.name, truckData.plateNumber || null, truckData.truckingCompanyId]
    );
    return result.rows[0];
  }

  // Get all trucks with company info
  static async getAll() {
    const result = await pool.query(`
      SELECT 
        t.id, 
        t.name, 
        t.plate_number, 
        t.trucking_company_id,
        tc.name AS trucking_company_name
      FROM trucks t
      JOIN trucking_companies tc ON t.trucking_company_id = tc.id
      ORDER BY t.created_at DESC
    `);
    return result.rows;
  }

  // Get single truck by ID
  static async findById(id) {
    const result = await pool.query(
      `
      SELECT 
        t.id, 
        t.name, 
        t.plate_number, 
        t.trucking_company_id,
        tc.name AS trucking_company_name
      FROM trucks t
      JOIN trucking_companies tc ON t.trucking_company_id = tc.id
      WHERE t.id = $1
      `,
      [id]
    );
    return result.rows[0];
  }

  // Update truck information
  static async update(id, truckData) {
    await pool.query(
      `UPDATE trucks
       SET name = $1, plate_number = $2, updated_at = NOW()
       WHERE id = $3`,
      [truckData.name, truckData.plateNumber, id]
    );
    return { id };
  }

  // Delete truck
  static async delete(id) {
    await pool.query(`DELETE FROM trucks WHERE id = $1`, [id]);
    return { id };
  }

  // Get trucks by company
  static async findByCompany(companyId) {
    const result = await pool.query(
      `
      SELECT 
        t.id, 
        t.name, 
        t.plate_number, 
        t.trucking_company_id,
        tc.name AS trucking_company_name
      FROM trucks t
      JOIN trucking_companies tc ON t.trucking_company_id = tc.id
      WHERE t.trucking_company_id = $1
      ORDER BY t.name
      `,
      [companyId]
    );
    return result.rows;
  }
}

export default Truck;