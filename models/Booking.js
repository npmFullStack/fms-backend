// models/Booking.js - Updated version with address fields
import { pool } from "../db/index.js";

export const createBooking = async bookingData => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const {
      user_id,
      shipper,
      first_name,
      last_name,
      phone,
      consignee,
      consignee_name,
      consignee_phone,
      shipping_line_id,
      ship_id,
      container_ids = [], // Array of container IDs
      quantity,
      booking_mode,
      commodity,
      origin_port,
      destination_port,
      // New address fields
      pickup_province,
      pickup_city,
      pickup_barangay,
      pickup_street,
      pickup_lat,
      pickup_lng,
      delivery_province,
      delivery_city,
      delivery_barangay,
      delivery_street,
      delivery_lat,
      delivery_lng,
      preferred_departure,
      preferred_delivery
    } = bookingData;

    // Create the main booking record
    const bookingResult = await client.query(
      `INSERT INTO bookings (
        user_id, shipper, first_name, last_name, phone,
        consignee, consignee_name, consignee_phone,
        shipping_line_id, ship_id, quantity, booking_mode,
        commodity, origin_port, destination_port,
        -- New address fields
        pickup_province, pickup_city, pickup_barangay, pickup_street,
        pickup_lat, pickup_lng,
        delivery_province, delivery_city, delivery_barangay, delivery_street,
        delivery_lat, delivery_lng,
        preferred_departure, preferred_delivery,
        booking_number, hwb_number
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8,
        $9, $10, $11, $12,
        $13, $14, $15,
        -- New address fields
        $16, $17, $18, $19,
        $20, $21,
        $22, $23, $24, $25,
        $26, $27,
        $28, $29,
        'BKG-' || LPAD(nextval('booking_number_seq')::text, 4, '0'),
        'HWB-' || LPAD(nextval('hwb_number_seq')::text, 4, '0')
      )
      RETURNING *`,
      [
        user_id, shipper, first_name, last_name, phone,
        consignee, consignee_name, consignee_phone,
        shipping_line_id, ship_id, quantity, booking_mode,
        commodity, origin_port, destination_port,
        // New address fields
        pickup_province, pickup_city, pickup_barangay, pickup_street,
        pickup_lat, pickup_lng,
        delivery_province, delivery_city, delivery_barangay, delivery_street,
        delivery_lat, delivery_lng,
        preferred_departure, preferred_delivery
      ]
    );

    const booking = bookingResult.rows[0];

    // Insert container associations if provided
    if (container_ids && container_ids.length > 0) {
      for (let i = 0; i < container_ids.length; i++) {
        await client.query(
          `INSERT INTO booking_containers (booking_id, container_id, sequence_number)
           VALUES ($1, $2, $3)`,
          [booking.id, container_ids[i], i + 1]
        );

        // Mark container as not returned (in use)
        await client.query(
          `UPDATE containers SET is_returned = FALSE WHERE id = $1`,
          [container_ids[i]]
        );
      }
    }

    await client.query('COMMIT');
    return booking;
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const updateBooking = async (id, bookingData) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const {
      shipper,
      first_name,
      last_name,
      phone,
      consignee,
      consignee_name,
      consignee_phone,
      shipping_line_id,
      ship_id,
      container_ids = [],
      quantity,
      booking_mode,
      commodity,
      origin_port,
      destination_port,
      // New address fields
      pickup_province,
      pickup_city,
      pickup_barangay,
      pickup_street,
      pickup_lat,
      pickup_lng,
      delivery_province,
      delivery_city,
      delivery_barangay,
      delivery_street,
      delivery_lat,
      delivery_lng,
      preferred_departure,
      preferred_delivery,
      status,
      payment_status
    } = bookingData;

    // Update the main booking record
    const result = await client.query(
      `UPDATE bookings SET
        shipper = $1,
        first_name = $2,
        last_name = $3,
        phone = $4,
        consignee = $5,
        consignee_name = $6,
        consignee_phone = $7,
        shipping_line_id = $8,
        ship_id = $9,
        quantity = $10,
        booking_mode = $11,
        commodity = $12,
        origin_port = $13,
        destination_port = $14,
        -- New address fields
        pickup_province = $15,
        pickup_city = $16,
        pickup_barangay = $17,
        pickup_street = $18,
        pickup_lat = $19,
        pickup_lng = $20,
        delivery_province = $21,
        delivery_city = $22,
        delivery_barangay = $23,
        delivery_street = $24,
        delivery_lat = $25,
        delivery_lng = $26,
        preferred_departure = $27,
        preferred_delivery = $28,
        status = $29,
        payment_status = $30,
        updated_at = NOW()
      WHERE id = $31
      RETURNING *`,
      [
        shipper, first_name, last_name, phone,
        consignee, consignee_name, consignee_phone,
        shipping_line_id, ship_id, quantity, booking_mode,
        commodity, origin_port, destination_port,
        // New address fields
        pickup_province, pickup_city, pickup_barangay, pickup_street,
        pickup_lat, pickup_lng,
        delivery_province, delivery_city, delivery_barangay, delivery_street,
        delivery_lat, delivery_lng,
        preferred_departure, preferred_delivery,
        status, payment_status, id
      ]
    );

    // If container_ids are provided, update container associations
    if (container_ids && container_ids.length > 0) {
      // First, get existing containers and mark them as returned
      const existingContainers = await client.query(
        `SELECT container_id FROM booking_containers WHERE booking_id = $1`,
        [id]
      );

      for (const row of existingContainers.rows) {
        await client.query(
          `UPDATE containers SET is_returned = TRUE WHERE id = $1`,
          [row.container_id]
        );
      }

      // Delete existing container associations
      await client.query(
        `DELETE FROM booking_containers WHERE booking_id = $1`,
        [id]
      );

      // Insert new container associations
      for (let i = 0; i < container_ids.length; i++) {
        await client.query(
          `INSERT INTO booking_containers (booking_id, container_id, sequence_number)
           VALUES ($1, $2, $3)`,
          [id, container_ids[i], i + 1]
        );

        // Mark new containers as not returned
        await client.query(
          `UPDATE containers SET is_returned = FALSE WHERE id = $1`,
          [container_ids[i]]
        );
      }
    }

    await client.query('COMMIT');
    return result.rows[0];
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getAllBookings = async () => {
  const result = await pool.query(`
    SELECT
      b.*,
      u.email AS created_by_email,
      ud.first_name AS created_by_first_name,
      ud.last_name AS created_by_last_name,
      sl.name AS shipping_line_name,
      s.vessel_number AS ship_vessel_number,
      COALESCE(
        JSON_AGG(
          CASE WHEN bc.container_id IS NOT NULL THEN
            JSON_BUILD_OBJECT(
              'container_id', c.id,
              'size', c.size,
              'van_number', c.van_number,
              'sequence_number', bc.sequence_number
            )
          END
        ) FILTER (WHERE bc.container_id IS NOT NULL),
        '[]'::json
      ) AS containers
    FROM bookings b
    LEFT JOIN users u ON b.user_id = u.id
    LEFT JOIN user_details ud ON u.id = ud.user_id
    LEFT JOIN shipping_lines sl ON b.shipping_line_id = sl.id
    LEFT JOIN ships s ON b.ship_id = s.id
    LEFT JOIN booking_containers bc ON b.id = bc.booking_id
    LEFT JOIN containers c ON bc.container_id = c.id
    GROUP BY b.id, u.email, ud.first_name, ud.last_name, sl.name, s.vessel_number
    ORDER BY b.created_at DESC
  `);
  return result.rows;
};

export const getBookingById = async id => {
  const result = await pool.query(
    `
    SELECT
      b.*,
      u.email AS created_by_email,
      ud.first_name AS created_by_first_name,
      ud.last_name AS created_by_last_name,
      sl.name AS shipping_line_name,
      s.vessel_number AS ship_vessel_number,
      COALESCE(
        JSON_AGG(
          CASE WHEN bc.container_id IS NOT NULL THEN
            JSON_BUILD_OBJECT(
              'container_id', c.id,
              'size', c.size,
              'van_number', c.van_number,
              'sequence_number', bc.sequence_number
            )
          END
        ) FILTER (WHERE bc.container_id IS NOT NULL),
        '[]'::json
      ) AS containers
    FROM bookings b
    LEFT JOIN users u ON b.user_id = u.id
    LEFT JOIN user_details ud ON u.id = ud.user_id
    LEFT JOIN shipping_lines sl ON b.shipping_line_id = sl.id
    LEFT JOIN ships s ON b.ship_id = s.id
    LEFT JOIN booking_containers bc ON b.id = bc.booking_id
    LEFT JOIN containers c ON bc.container_id = c.id
    WHERE b.id = $1
    GROUP BY b.id, u.email, ud.first_name, ud.last_name, sl.name, s.vessel_number
    `,
    [id]
  );
  return result.rows[0];
};

export const deleteBooking = async id => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get containers to mark as returned
    const containers = await client.query(
      `SELECT container_id FROM booking_containers WHERE booking_id = $1`,
      [id]
    );

    // Mark containers as returned
    for (const row of containers.rows) {
      await client.query(
        `UPDATE containers SET is_returned = TRUE WHERE id = $1`,
        [row.container_id]
      );
    }

    // Delete booking (cascade will handle booking_containers)
    await client.query("DELETE FROM bookings WHERE id = $1", [id]);
    
    await client.query('COMMIT');
    return { id };
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// New function to get available containers for a shipping line
export const getAvailableContainers = async (shipping_line_id) => {
  const result = await pool.query(
    `SELECT id, size, van_number, created_at
     FROM containers 
     WHERE shipping_line_id = $1 AND is_returned = TRUE
     ORDER BY size, van_number`,
    [shipping_line_id]
  );
  return result.rows;
};