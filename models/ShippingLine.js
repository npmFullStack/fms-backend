import { pool } from "../db/index.js";

export const getAllShippingLines = async () => {
  return await pool.query(
    `SELECT sl.*, sld.logo_url 
     FROM shipping_lines sl
     LEFT JOIN shipping_line_details sld ON sl.id = sld.shipping_line_id
     ORDER BY sl.name`
  );
};

export const getShippingLineById = async (id) => {
  return await pool.query(
    `SELECT sl.*, sld.logo_url 
     FROM shipping_lines sl
     LEFT JOIN shipping_line_details sld ON sl.id = sld.shipping_line_id
     WHERE sl.id = $1`,
    [id]
  );
};

export const createShippingLine = async (id, name, logoUrl) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Insert into shipping_lines
    await client.query(
      'INSERT INTO shipping_lines (id, name) VALUES ($1, $2)',
      [id, name]
    );
    
    // Insert into shipping_line_details if logo exists
    if (logoUrl) {
      await client.query(
        'INSERT INTO shipping_line_details (shipping_line_id, logo_url) VALUES ($1, $2)',
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

export const updateShippingLine = async (id, name, logoUrl) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Update shipping_lines
    await client.query(
      'UPDATE shipping_lines SET name = $1 WHERE id = $2',
      [name, id]
    );
    
    // Update or insert shipping_line_details
    const detailsExist = await client.query(
      'SELECT 1 FROM shipping_line_details WHERE shipping_line_id = $1',
      [id]
    );
    
    if (logoUrl) {
      if (detailsExist.rows.length) {
        await client.query(
          'UPDATE shipping_line_details SET logo_url = $1 WHERE shipping_line_id = $2',
          [logoUrl, id]
        );
      } else {
        await client.query(
          'INSERT INTO shipping_line_details (shipping_line_id, logo_url) VALUES ($1, $2)',
          [id, logoUrl]
        );
      }
    } else if (detailsExist.rows.length) {
      await client.query(
        'UPDATE shipping_line_details SET logo_url = NULL WHERE shipping_line_id = $1',
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

export const toggleShippingLineStatus = async (id) => {
  return await pool.query(
    'UPDATE shipping_lines SET is_active = NOT is_active WHERE id = $1 RETURNING *',
    [id]
  );
};