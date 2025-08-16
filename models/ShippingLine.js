import { pool } from "../db/index.js";

// Get all shipping lines
export const getAllShippingLines = async () => {
  return await pool.query(
    `SELECT sl.id, sl.name, sl.is_active, sl.created_at, sl.updated_at,
     sld.logo_url, sld.contact_email, sld.contact_phone, sld.website
     FROM shipping_lines sl
     LEFT JOIN shipping_line_details sld ON sl.id = sld.shipping_line_id
     ORDER BY sl.name`
  );
};

// Get shipping line by ID
export const getShippingLineById = async (id) => {
  return await pool.query(
    `SELECT sl.id, sl.name, sl.is_active, sl.created_at, sl.updated_at,
     sld.logo_url, sld.contact_email, sld.contact_phone, sld.website
     FROM shipping_lines sl
     LEFT JOIN shipping_line_details sld ON sl.id = sld.shipping_line_id
     WHERE sl.id = $1`,
    [id]
  );
};

// Create shipping line
export const createShippingLine = async (
  id,
  name,
  logoUrl = null,
  contactEmail = null,
  contactPhone = null,
  website = null
) => {
  await pool.query("BEGIN");
  try {
    await pool.query(
      `INSERT INTO shipping_lines (id, name) VALUES ($1, $2)`,
      [id, name]
    );
    
    await pool.query(
      `INSERT INTO shipping_line_details 
       (shipping_line_id, logo_url, contact_email, contact_phone, website)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, logoUrl, contactEmail, contactPhone, website]
    );
    
    await pool.query("COMMIT");
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }
};

// Update shipping line
export const updateShippingLine = async (
  id,
  name,
  logoUrl = null,
  contactEmail = null,
  contactPhone = null,
  website = null
) => {
  await pool.query("BEGIN");
  try {
    await pool.query(
      `UPDATE shipping_lines SET name = $2 WHERE id = $1`,
      [id, name]
    );
    
    await pool.query(
      `UPDATE shipping_line_details 
       SET logo_url = $2, contact_email = $3, contact_phone = $4, website = $5
       WHERE shipping_line_id = $1`,
      [id, logoUrl, contactEmail, contactPhone, website]
    );
    
    await pool.query("COMMIT");
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }
};

// Toggle shipping line active status
export const toggleShippingLineStatus = async (id) => {
  return await pool.query(
    `UPDATE shipping_lines 
     SET is_active = NOT is_active 
     WHERE id = $1 RETURNING *`,
    [id]
  );
};