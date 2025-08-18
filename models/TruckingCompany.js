import { pool } from "../db/index.js";

export const getAllTruckingCompanies = async () => {
  return await pool.query(
    `SELECT tc.*, tcd.logo_url 
     FROM trucking_companies tc
     LEFT JOIN trucking_company_details tcd ON tc.id = tcd.trucking_company_id
     ORDER BY tc.name`
  );
};

export const getTruckingCompanyById = async (id) => {
  return await pool.query(
    `SELECT tc.*, tcd.logo_url 
     FROM trucking_companies tc
     LEFT JOIN trucking_company_details tcd ON tc.id = tcd.trucking_company_id
     WHERE tc.id = $1`,
    [id]
  );
};

export const createTruckingCompany = async (id, name, logoUrl) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Insert into trucking_companies
    await client.query(
      'INSERT INTO trucking_companies (id, name) VALUES ($1, $2)',
      [id, name]
    );
    
    // Insert into trucking_company_details if logo exists
    if (logoUrl) {
      await client.query(
        'INSERT INTO trucking_company_details (trucking_company_id, logo_url) VALUES ($1, $2)',
        [id, logoUrl]
      );
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const updateTruckingCompany = async (id, name, logoUrl) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Update trucking_companies
    await client.query(
      'UPDATE trucking_companies SET name = $1 WHERE id = $2',
      [name, id]
    );
    
    // Update or insert trucking_company_details
    const detailsExist = await client.query(
      'SELECT 1 FROM trucking_company_details WHERE trucking_company_id = $1',
      [id]
    );
    
    if (logoUrl) {
      if (detailsExist.rows.length) {
        await client.query(
          'UPDATE trucking_company_details SET logo_url = $1 WHERE trucking_company_id = $2',
          [logoUrl, id]
        );
      } else {
        await client.query(
          'INSERT INTO trucking_company_details (trucking_company_id, logo_url) VALUES ($1, $2)',
          [id, logoUrl]
        );
      }
    } else if (detailsExist.rows.length) {
      await client.query(
        'UPDATE trucking_company_details SET logo_url = NULL WHERE trucking_company_id = $1',
        [id]
      );
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const toggleTruckingCompanyStatus = async (id) => {
  return await pool.query(
    'UPDATE trucking_companies SET is_active = NOT is_active WHERE id = $1 RETURNING *',
    [id]
  );
};