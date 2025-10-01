// models/Truck.js
import { pool } from "../db/index.js";

// Create a new truck - return full object
export const createTruck = async ({ name, plateNumber, truckingCompanyId }) => {
    const result = await pool.query(
        `INSERT INTO trucks (name, plate_number, trucking_company_id)
         VALUES ($1, $2, $3)
         RETURNING id, name, plate_number, trucking_company_id, created_at, updated_at`,
        [name, plateNumber || null, truckingCompanyId]
    );

    return result.rows[0]; // ✅ Return full truck object
};

// Fetch all trucks
export const getAllTrucks = async () => {
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
};

// Fetch a single truck
export const getTruckById = async id => {
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
};

// Update truck info
export const updateTruck = async (id, { name, plateNumber }) => {
    await pool.query(
        `UPDATE trucks
         SET name = $1, plate_number = $2, updated_at = NOW()
         WHERE id = $3`,
        [name, plateNumber || null, id]
    );

    return { id };
};

// Delete a truck
export const deleteTruck = async id => {
    await pool.query(`DELETE FROM trucks WHERE id = $1`, [id]);
    return { id };
};
