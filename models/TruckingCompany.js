import { pool } from "../db/index.js";

export const getAllTruckingCompanies = async () => {
  return await pool.query(
    `SELECT * FROM trucking_companies
     ORDER BY name`
  );
};

export const getTruckingCompanyById = async (id) => {
  return await pool.query(
    `SELECT * FROM trucking_companies WHERE id = $1`,
    [id]
  );
};

export const createTruckingCompany = async (id, name, logoUrl) => {
  return await pool.query(
    `INSERT INTO trucking_companies (id, name, logo_url)
     VALUES ($1, $2, $3)`,
    [id, name, logoUrl || null]
  );
};

export const updateTruckingCompany = async (id, name, logoUrl) => {
  return await pool.query(
    `UPDATE trucking_companies
     SET name = $1,
         logo_url = $2,
         updated_at = NOW()
     WHERE id = $3`,
    [name, logoUrl || null, id]
  );
};

export const deleteTruckingCompanyById = async (id) => {
  return await pool.query(
    `DELETE FROM trucking_companies WHERE id = $1`,
    [id]
  );
};

export const getSuccessBookingsByTruckingCompany = async (companyId) => {
  return await pool.query(
    `
    SELECT COUNT(*) AS total_success
    FROM bookings
    WHERE (pickup_trucker_id = $1 OR delivery_trucker_id = $1)
      AND status = 'DELIVERED'
    `,
    [companyId]
  );
};