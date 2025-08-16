import { pool } from "../db/index.js";

// Get all trucking companies
export const getAllTruckingCompanies = async () => {
  return await pool.query(
    `SELECT tc.id, tc.name, tc.is_active, tc.created_at, tc.updated_at,
     tcd.logo_url, tcd.contact_email, tcd.contact_phone, tcd.service_routes
     FROM trucking_companies tc
     LEFT JOIN trucking_company_details tcd ON tc.id = tcd.trucking_company_id
     ORDER BY tc.name`
  );
};

// Get trucking company by ID
export const getTruckingCompanyById = async (id) => {
  return await pool.query(
    `SELECT tc.id, tc.name, tc.is_active, tc.created_at, tc.updated_at,
     tcd.logo_url, tcd.contact_email, tcd.contact_phone, tcd.service_routes
     FROM trucking_companies tc
     LEFT JOIN trucking_company_details tcd ON tc.id = tcd.trucking_company_id
     WHERE tc.id = $1`,
    [id]
  );
};

// Create trucking company
export const createTruckingCompany = async (
  id,
  name,
  logoUrl = null,
  contactEmail = null,
  contactPhone = null,
  serviceRoutes = []
) => {
  await pool.query("BEGIN");
  try {
    await pool.query(
      `INSERT INTO trucking_companies (id, name) VALUES ($1, $2)`,
      [id, name]
    );
    
    await pool.query(
      `INSERT INTO trucking_company_details 
       (trucking_company_id, logo_url, contact_email, contact_phone, service_routes)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, logoUrl, contactEmail, contactPhone, serviceRoutes]
    );
    
    await pool.query("COMMIT");
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }
};

// Update trucking company
export const updateTruckingCompany = async (
  id,
  name,
  logoUrl = null,
  contactEmail = null,
  contactPhone = null,
  serviceRoutes = []
) => {
  await pool.query("BEGIN");
  try {
    await pool.query(
      `UPDATE trucking_companies SET name = $2 WHERE id = $1`,
      [id, name]
    );
    
    await pool.query(
      `UPDATE trucking_company_details 
       SET logo_url = $2, contact_email = $3, contact_phone = $4, service_routes = $5
       WHERE trucking_company_id = $1`,
      [id, logoUrl, contactEmail, contactPhone, serviceRoutes]
    );
    
    await pool.query("COMMIT");
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }
};

// Toggle trucking company active status
export const toggleTruckingCompanyStatus = async (id) => {
  return await pool.query(
    `UPDATE trucking_companies 
     SET is_active = NOT is_active 
     WHERE id = $1 RETURNING *`,
    [id]
  );
};