// models/Truck.js
import { pool } from "../db/index.js";

// Create a new truck
export const createTruck = async ({ name, plateNumber, truckingCompanyId, remarks }) => {
  const result = await pool.query(
    `INSERT INTO trucks (name, plate_number, trucking_company_id)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [name, plateNumber || null, truckingCompanyId]
  );

  const truckId = result.rows[0].id;

  // Optional remarks saved in truck_details
  await pool.query(
    `INSERT INTO truck_details (truck_id, remarks)
     VALUES ($1, $2)
     ON CONFLICT (truck_id)
     DO UPDATE SET remarks = EXCLUDED.remarks, updated_at = NOW()`,
    [truckId, remarks || null]
  );

  return { id: truckId };
};

// Fetch all trucks
export const getAllTrucks = async () => {
  const result = await pool.query(`
    SELECT t.id, t.name, t.plate_number, t.trucking_company_id,
           tc.name AS trucking_company_name, td.remarks
    FROM trucks t
    JOIN trucking_companies tc ON t.trucking_company_id = tc.id
    LEFT JOIN truck_details td ON t.id = td.truck_id
    ORDER BY t.created_at DESC
  `);
  return result.rows;
};

// Fetch a single truck
export const getTruckById = async (id) => {
  const result = await pool.query(`
    SELECT t.id, t.name, t.plate_number, t.trucking_company_id,
           tc.name AS trucking_company_name, td.remarks
    FROM trucks t
    JOIN trucking_companies tc ON t.trucking_company_id = tc.id
    LEFT JOIN truck_details td ON t.id = td.truck_id
    WHERE t.id = $1
  `, [id]);

  return result.rows[0];
};

// Update truck info
export const updateTruck = async (id, { name, plateNumber, remarks }) => {
  await pool.query(
    `UPDATE trucks
     SET name = $1, plate_number = $2, updated_at = NOW()
     WHERE id = $3`,
    [name, plateNumber || null, id]
  );

  await pool.query(
    `INSERT INTO truck_details (truck_id, remarks)
     VALUES ($1, $2)
     ON CONFLICT (truck_id)
     DO UPDATE SET remarks = EXCLUDED.remarks, updated_at = NOW()`,
    [id, remarks || null]
  );

  return { id };
};

// Delete a truck
export const deleteTruck = async (id) => {
  await pool.query(`DELETE FROM trucks WHERE id = $1`, [id]);
  return { id };
};
