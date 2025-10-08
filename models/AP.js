// models/AP.js
import { pool } from "../db/index.js";

class AP {
  /**
   * 🧠 Fetch all AP records from the ap_summary view
   */
  static async getAll() {
    const query = `
      SELECT * 
      FROM ap_summary 
      ORDER BY ap_id DESC;
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  /**
   * ✍️ Upsert AP record (insert if not exists, else update)
   */
  static async upsert(apId, data) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Check if AP exists
      const check = await client.query(
        "SELECT ap_id FROM accounts_payable WHERE ap_id = $1",
        [apId]
      );

      let result;

      if (check.rowCount === 0) {
        // INSERT
        const fields = Object.keys(data);
        const values = Object.values(data);
        const placeholders = fields.map((_, i) => `$${i + 2}`).join(", ");

        const insertSQL = `
          INSERT INTO accounts_payable (ap_id, ${fields.join(", ")})
          VALUES ($1, ${placeholders})
          RETURNING *;
        `;
        const insertRes = await client.query(insertSQL, [apId, ...values]);
        result = { action: "created", record: insertRes.rows[0] };
      } else {
        // UPDATE
        const fields = Object.keys(data);
        const values = Object.values(data);
        const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(", ");

        const updateSQL = `
          UPDATE accounts_payable
          SET ${setClause}
          WHERE ap_id = $${values.length + 1}
          RETURNING *;
        `;
        const updateRes = await client.query(updateSQL, [...values, apId]);
        result = { action: "updated", record: updateRes.rows[0] };
      }

      await client.query("COMMIT");
      return result;
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("AP.upsert error:", err);
      throw err;
    } finally {
      client.release();
    }
  }
}

export default AP;
