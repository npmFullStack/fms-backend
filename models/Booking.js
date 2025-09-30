// models/Booking.js
import { pool } from "../db/index.js";

export const createBooking = async bookingData => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

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
      container_ids = [],
      quantity,
      booking_mode,
      commodity,
      origin_port,
      destination_port,

      // Address fields
      pickup_province,
      pickup_city,
      pickup_barangay,
      pickup_street,
      delivery_province,
      delivery_city,
      delivery_barangay,
      delivery_street,

      // Trucking fields
      pickup_trucker_id,
      pickup_truck_id,
      delivery_trucker_id,
      delivery_truck_id
    } = bookingData;

    const bookingResult = await client.query(
      `INSERT INTO bookings (
        user_id, shipper, first_name, last_name, phone,
        consignee, consignee_name, consignee_phone,
        shipping_line_id, ship_id, quantity, booking_mode,
        commodity, origin_port, destination_port,
        pickup_province, pickup_city, pickup_barangay, pickup_street,
        delivery_province, delivery_city, delivery_barangay, delivery_street,
        pickup_trucker_id, pickup_truck_id, delivery_trucker_id, delivery_truck_id,
        booking_number, hwb_number
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8,
        $9, $10, $11, $12,
        $13, $14, $15,
        $16, $17, $18, $19,
        $20, $21, $22, $23,
        $24, $25, $26, $27,
        'BKG-' || LPAD(nextval('booking_number_seq')::text, 4, '0'),
        'HWB-' || LPAD(nextval('hwb_number_seq')::text, 4, '0')
      )
      RETURNING *`,
      [
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
        quantity,
        booking_mode,
        commodity,
        origin_port,
        destination_port,
        pickup_province,
        pickup_city,
        pickup_barangay,
        pickup_street,
        delivery_province,
        delivery_city,
        delivery_barangay,
        delivery_street,
        pickup_trucker_id,
        pickup_truck_id,
        delivery_trucker_id,
        delivery_truck_id
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
        await client.query(
          `UPDATE containers SET is_returned = FALSE WHERE id = $1`,
          [container_ids[i]]
        );
      }
    }

    await client.query("COMMIT");
    return booking;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const updateBooking = async (id, bookingData) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

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
      // Address fields
      pickup_province,
      pickup_city,
      pickup_barangay,
      pickup_street,
      delivery_province,
      delivery_city,
      delivery_barangay,
      delivery_street,
      // Trucking fields
      pickup_trucker_id,
      pickup_truck_id,
      delivery_trucker_id,
      delivery_truck_id,
      status,
      payment_status
    } = bookingData;

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
        pickup_province = $15,
        pickup_city = $16,
        pickup_barangay = $17,
        pickup_street = $18,
        delivery_province = $19,
        delivery_city = $20,
        delivery_barangay = $21,
        delivery_street = $22,
        pickup_trucker_id = $23,
        pickup_truck_id = $24,
        delivery_trucker_id = $25,
        delivery_truck_id = $26,
        status = $27,
        payment_status = $28,
        updated_at = NOW()
      WHERE id = $29
      RETURNING *`,
      [
        shipper,
        first_name,
        last_name,
        phone,
        consignee,
        consignee_name,
        consignee_phone,
        shipping_line_id,
        ship_id,
        quantity,
        booking_mode,
        commodity,
        origin_port,
        destination_port,
        pickup_province,
        pickup_city,
        pickup_barangay,
        pickup_street,
        delivery_province,
        delivery_city,
        delivery_barangay,
        delivery_street,
        pickup_trucker_id,
        pickup_truck_id,
        delivery_trucker_id,
        delivery_truck_id,
        status,
        payment_status,
        id
      ]
    );

    // Update container associations
    if (container_ids && container_ids.length > 0) {
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
      await client.query(`DELETE FROM booking_containers WHERE booking_id = $1`, [id]);
      for (let i = 0; i < container_ids.length; i++) {
        await client.query(
          `INSERT INTO booking_containers (booking_id, container_id, sequence_number) 
           VALUES ($1, $2, $3)`,
          [id, container_ids[i], i + 1]
        );
        await client.query(
          `UPDATE containers SET is_returned = FALSE WHERE id = $1`,
          [container_ids[i]]
        );
      }
    }

    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
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
      pt.name AS pickup_trucker_name,
      ptk.plate_number AS pickup_truck_plate,
      dt.name AS delivery_trucker_name,
      dtk.plate_number AS delivery_truck_plate,
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
    LEFT JOIN trucking_companies pt ON b.pickup_trucker_id = pt.id
    LEFT JOIN trucks ptk ON b.pickup_truck_id = ptk.id
    LEFT JOIN trucking_companies dt ON b.delivery_trucker_id = dt.id
    LEFT JOIN trucks dtk ON b.delivery_truck_id = dtk.id
    GROUP BY b.id, u.email, ud.first_name, ud.last_name, sl.name, s.vessel_number,
             pt.name, ptk.plate_number, dt.name, dtk.plate_number
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
      pt.name AS pickup_trucker_name,
      ptk.plate_number AS pickup_truck_plate,
      dt.name AS delivery_trucker_name,
      dtk.plate_number AS delivery_truck_plate,
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
    LEFT JOIN trucking_companies pt ON b.pickup_trucker_id = pt.id
    LEFT JOIN trucks ptk ON b.pickup_truck_id = ptk.id
    LEFT JOIN trucking_companies dt ON b.delivery_trucker_id = dt.id
    LEFT JOIN trucks dtk ON b.delivery_truck_id = dtk.id
    WHERE b.id = $1
    GROUP BY b.id, u.email, ud.first_name, ud.last_name, sl.name, s.vessel_number,
             pt.name, ptk.plate_number, dt.name, dtk.plate_number
    `,
    [id]
  );
  return result.rows[0];
};

export const deleteBooking = async id => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const containers = await client.query(
      `SELECT container_id FROM booking_containers WHERE booking_id = $1`,
      [id]
    );

    for (const row of containers.rows) {
      await client.query(
        `UPDATE containers SET is_returned = TRUE WHERE id = $1`,
        [row.container_id]
      );
    }

    await client.query(`DELETE FROM bookings WHERE id = $1`, [id]);

    await client.query("COMMIT");
    return { id };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// Get booking status history
export const getBookingStatusHistory = async (bookingId) => {
  try {
    const result = await pool.query(
      `
      SELECT 
        id,
        status,
        status_date,
        created_at
      FROM booking_status_history
      WHERE booking_id = $1
      ORDER BY status_date ASC
      `,
      [bookingId]
    );
    return result.rows;
  } catch (error) {
    console.error("Database query error (booking history):", error);
    throw new Error("Database query failed");
  }
};

// Add status history entry
export const addBookingStatusHistory = async (bookingId, status, statusDate = null) => {
  try {
    const result = await pool.query(
      `
      INSERT INTO booking_status_history (booking_id, status, status_date)
      VALUES ($1, $2, COALESCE($3, NOW()))
      RETURNING *
      `,
      [bookingId, status, statusDate]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Database insert error (booking history):", error);
    throw new Error("Database insert failed");
  }
};

// Update status history date
export const updateStatusHistoryDate = async (historyId, newDate) => {
  try {
    const result = await pool.query(
      `
      UPDATE booking_status_history
      SET status_date = $1
      WHERE id = $2
      RETURNING *
      `,
      [newDate, historyId]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Database update error (booking history):", error);
    throw new Error("Database update failed");
  }
};