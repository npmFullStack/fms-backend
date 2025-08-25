import { pool } from "../db/index.js";

// Create a ship WITH routes and pricing
export const createShip = async ({
    name,
    vesselNumber,
    shippingLineId,
    routes
}) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // 1) Create ship
        const shipRes = await client.query(
            `INSERT INTO ships (name, vessel_number, shipping_line_id)
       VALUES ($1, $2, $3) RETURNING id`,
            [name, vesselNumber || null, shippingLineId]
        );
        const shipId = shipRes.rows[0].id;

        // 2) Insert placeholder into ship_details (remarks is optional)
        await client.query(
            `INSERT INTO ship_details (ship_id, remarks) VALUES ($1, $2)
       ON CONFLICT (ship_id) DO NOTHING`,
            [shipId, null]
        );

        // 3) Routes + pricing
        for (const route of routes) {
            const routeRes = await client.query(
                `INSERT INTO shipping_routes (ship_id, origin, destination)
         VALUES ($1, $2, $3) RETURNING id`,
                [shipId, route.origin.value, route.destination.value]
            );
            const routeId = routeRes.rows[0].id;

            for (const price of route.pricing) {
                await client.query(
                    `INSERT INTO container_pricing (shipping_route_id, container_type, price)
           VALUES ($1, $2, $3)`,
                    [routeId, price.type, price.price]
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

export const getAllShips = async () => {
    const result = await pool.query(`
    SELECT 
      s.id,
      s.name,
      s.vessel_number,
      s.shipping_line_id,  
      sl.name AS shipping_line_name,
      sd.remarks,
      json_agg(
        DISTINCT jsonb_build_object(
          'id', r.id,
          'origin', r.origin,
          'destination', r.destination,
          'pricing', (
            SELECT json_agg(
              jsonb_build_object(
                'id', cp.id,
                'container_type', cp.container_type,
                'price', cp.price,
                'valid_from', cp.valid_from,
                'valid_to', cp.valid_to
              )
            )
            FROM container_pricing cp
            WHERE cp.shipping_route_id = r.id
          )
        )
      ) FILTER (WHERE r.id IS NOT NULL) AS routes
    FROM ships s
    JOIN shipping_lines sl ON s.shipping_line_id = sl.id
    LEFT JOIN ship_details sd ON s.id = sd.ship_id
    LEFT JOIN shipping_routes r ON s.id = r.ship_id
    GROUP BY s.id, sl.name, sd.remarks
    ORDER BY s.created_at DESC
  `);

    return result.rows;
};

// Get single ship with routes + pricing
export const getShipById = async id => {
    const result = await pool.query(
        `
    SELECT s.id, s.name, s.vessel_number,
           sl.name AS shipping_line_name,
           sd.remarks,
           json_agg(
             json_build_object(
               'id', r.id,
               'origin', r.origin,
               'destination', r.destination,
               'pricing', (
                 SELECT json_agg(
                   json_build_object(
                     'id', cp.id,
                     'container_type', cp.container_type,
                     'price', cp.price,
                     'valid_from', cp.valid_from,
                     'valid_to', cp.valid_to
                   )
                 )
                 FROM container_pricing cp
                 WHERE cp.shipping_route_id = r.id
               )
             )
           ) FILTER (WHERE r.id IS NOT NULL) AS routes
    FROM ships s
    JOIN shipping_lines sl ON s.shipping_line_id = sl.id
    LEFT JOIN ship_details sd ON s.id = sd.ship_id
    LEFT JOIN shipping_routes r ON s.id = r.ship_id
    WHERE s.id = $1
    GROUP BY s.id, sl.name, sd.remarks
  `,
        [id]
    );
    return result.rows[0];
};

// Update ship
export const updateShip = async (id, { name, vessel_number, remarks }) => {
    await pool.query(
        `UPDATE ships SET name = $1, vessel_number = $2, updated_at = NOW() WHERE id = $3`,
        [name, vessel_number || null, id]
    );
    await pool.query(
        `UPDATE ship_details SET remarks = $1, updated_at = NOW() WHERE ship_id = $2`,
        [remarks || null, id]
    );
    return { id };
};

// Delete ship
export const deleteShip = async id => {
    await pool.query(`DELETE FROM ships WHERE id = $1`, [id]);
    return { id };
};
