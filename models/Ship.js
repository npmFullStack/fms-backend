import { pool } from "../db/index.js";

// Create a ship WITH containers
export const createShip = async ({ vesselNumber, shippingLineId, containers }) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1) Create ship
    const shipRes = await client.query(
      `INSERT INTO ships (vessel_number, shipping_line_id)
       VALUES ($1, $2)
       RETURNING id`,
      [vesselNumber || null, shippingLineId]
    );
    const shipId = shipRes.rows[0].id;

    // 2) Insert placeholder into ship_details (remarks is optional)
    await client.query(
      `INSERT INTO ship_details (ship_id, remarks) VALUES ($1, $2)
       ON CONFLICT (ship_id) DO NOTHING`,
      [shipId, null]
    );

    // 3) Containers
    if (containers && containers.length > 0) {
      for (const container of containers) {
        await client.query(
          `INSERT INTO containers (ship_id, size, van_number)
           VALUES ($1, $2, $3)`,
          [shipId, container.size, container.vanNumber]
        );
      }
    }

    await client.query("COMMIT");
    return { id: shipId };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

// Get all ships WITH containers
export const getAllShips = async () => {
  const result = await pool.query(`
    SELECT 
      s.id,
      s.vessel_number,
      s.shipping_line_id,
      sl.name AS shipping_line_name,
      sd.remarks,
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'id', c.id,
            'size', c.size,
            'van_number', c.van_number,
            'created_at', c.created_at
          )
        ) FILTER (WHERE c.id IS NOT NULL), '[]'
      ) AS containers
    FROM ships s
    JOIN shipping_lines sl ON s.shipping_line_id = sl.id
    LEFT JOIN ship_details sd ON s.id = sd.ship_id
    LEFT JOIN containers c ON s.id = c.ship_id
    GROUP BY s.id, sl.name, sd.remarks
    ORDER BY s.created_at DESC
  `);

  return result.rows;
};

// Get single ship WITH containers
export const getShipById = async (id) => {
  const result = await pool.query(
    `
    SELECT 
      s.id,
      s.vessel_number,
      s.shipping_line_id,
      sl.name AS shipping_line_name,
      sd.remarks,
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'id', c.id,
            'size', c.size,
            'van_number', c.van_number,
            'created_at', c.created_at
          )
        ) FILTER (WHERE c.id IS NOT NULL), '[]'
      ) AS containers
    FROM ships s
    JOIN shipping_lines sl ON s.shipping_line_id = sl.id
    LEFT JOIN ship_details sd ON s.id = sd.ship_id
    LEFT JOIN containers c ON s.id = c.ship_id
    WHERE s.id = $1
    GROUP BY s.id, sl.name, sd.remarks
  `,
    [id]
  );

  return result.rows[0];
};

// Update ship (vesselNumber + remarks only)
export const updateShip = async (id, { vesselNumber, remarks }) => {
  await pool.query(
    `UPDATE ships SET vessel_number = $1, updated_at = NOW() WHERE id = $2`,
    [vesselNumber || null, id]
  );
  await pool.query(
    `UPDATE ship_details SET remarks = $1, updated_at = NOW() WHERE ship_id = $2`,
    [remarks || null, id]
  );
  return { id };
};

// Delete ship (containers will be auto-deleted via CASCADE)
export const deleteShip = async (id) => {
  await pool.query(`DELETE FROM ships WHERE id = $1`, [id]);
  return { id };
};
