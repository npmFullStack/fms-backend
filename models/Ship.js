import { pool } from "../db/index.js";

class Ship {
  // Create new ship
  static async create(shipData) {
    const result = await pool.query(
      `INSERT INTO ships (ship_name, vessel_number, shipping_line_id)
       VALUES ($1, $2, $3)
       RETURNING id, ship_name, vessel_number, shipping_line_id, created_at, updated_at`,
      [shipData.shipName, shipData.vesselNumber || null, shipData.shippingLineId]
    );
    return result.rows[0];
  }

  // Get all ships with shipping line info
  static async getAll() {
    const result = await pool.query(`
      SELECT
        s.id,
        s.ship_name,
        s.vessel_number,
        s.shipping_line_id,
        sl.name AS shipping_line_name
      FROM ships s
      JOIN shipping_lines sl ON s.shipping_line_id = sl.id
      ORDER BY s.created_at DESC
    `);
    return result.rows;
  }

  // Get single ship by ID
  static async findById(id) {
    const result = await pool.query(
      `
      SELECT
        s.id,
        s.ship_name,
        s.vessel_number,
        s.shipping_line_id,
        sl.name AS shipping_line_name
      FROM ships s
      JOIN shipping_lines sl ON s.shipping_line_id = sl.id
      WHERE s.id = $1
      `,
      [id]
    );
    return result.rows[0];
  }

  // Update ship information
  static async update(id, shipData) {
    await pool.query(
      `UPDATE ships
       SET ship_name = $1, vessel_number = $2, updated_at = NOW()
       WHERE id = $3`,
      [shipData.shipName, shipData.vesselNumber, id]
    );
    return { id };
  }

  // Delete ship
  static async delete(id) {
    await pool.query(`DELETE FROM ships WHERE id = $1`, [id]);
    return { id };
  }

  // Get ships by shipping line
  static async findByShippingLine(lineId) {
    const result = await pool.query(
      `
      SELECT
        s.id,
        s.ship_name,
        s.vessel_number,
        s.shipping_line_id,
        sl.name AS shipping_line_name
      FROM ships s
      JOIN shipping_lines sl ON s.shipping_line_id = sl.id
      WHERE s.shipping_line_id = $1
      ORDER BY s.ship_name
      `,
      [lineId]
    );
    return result.rows;
  }
}

export default Ship;