// models/Booking.js
import { pool } from "../db/index.js";

// ================== CREATE BOOKING ==================
export const createBooking = async bookingData => {
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

  // Insert into bookings
  const bookingResult = await pool.query(
    `INSERT INTO bookings (
      user_id, shipping_line_id, ship_id, quantity, booking_mode,
      commodity, origin_port, destination_port,
      booking_number, hwb_number
    )
    VALUES (
      $1,$2,$3,$4,$5,
      $6,$7,$8,
      'BKG-' || LPAD(nextval('booking_number_seq')::text, 4, '0'),
      'HWB-' || LPAD(nextval('hwb_number_seq')::text, 4, '0')
    )
    RETURNING *`,
    [
      user_id,
      shipping_line_id,
      ship_id,
      quantity,
      booking_mode,
      commodity,
      origin_port,
      destination_port
    ]
  );

  const booking = bookingResult.rows[0];

  // Insert shipper details
  await pool.query(
    `INSERT INTO booking_shipper_details 
    (booking_id, company_name, first_name, last_name, phone)
    VALUES ($1,$2,$3,$4,$5)`,
    [booking.id, shipper, first_name, last_name, phone]
  );

  // Insert consignee details
  await pool.query(
    `INSERT INTO booking_consignee_details
    (booking_id, company_name, contact_name, phone)
    VALUES ($1,$2,$3,$4)`,
    [booking.id, consignee, consignee_name, consignee_phone]
  );

  // Insert pickup address
  await pool.query(
    `INSERT INTO booking_pickup_addresses
    (booking_id, province, city, barangay, street)
    VALUES ($1,$2,$3,$4,$5)`,
    [booking.id, pickup_province, pickup_city, pickup_barangay, pickup_street]
  );

  // Insert delivery address
  await pool.query(
    `INSERT INTO booking_delivery_addresses
    (booking_id, province, city, barangay, street)
    VALUES ($1,$2,$3,$4,$5)`,
    [booking.id, delivery_province, delivery_city, delivery_barangay, delivery_street]
  );

  // Insert containers
  if (container_ids.length > 0) {
    for (let i = 0; i < container_ids.length; i++) {
      await pool.query(
        `INSERT INTO booking_containers (booking_id, container_id, sequence_number)
         VALUES ($1,$2,$3)`,
        [booking.id, container_ids[i], i + 1]
      );
      await pool.query(
        `UPDATE containers SET is_returned=FALSE WHERE id=$1`,
        [container_ids[i]]
      );
    }
  }

  // Insert trucking assignment
  await pool.query(
    `INSERT INTO booking_truck_assignments
      (booking_id, pickup_trucker_id, pickup_truck_id, delivery_trucker_id, delivery_truck_id)
     VALUES ($1,$2,$3,$4,$5)`,
    [booking.id, pickup_trucker_id, pickup_truck_id, delivery_trucker_id, delivery_truck_id]
  );

  return booking;
};

// ================== UPDATE BOOKING ==================
export const updateBooking = async (id, bookingData) => {
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

  // Update main booking
  const result = await pool.query(
    `UPDATE bookings SET
      shipping_line_id=$1, ship_id=$2,
      quantity=$3, booking_mode=$4,
      commodity=$5, origin_port=$6, destination_port=$7,
      status=$8, payment_status=$9,
      updated_at=NOW()
    WHERE id=$10
    RETURNING *`,
    [
      shipping_line_id, ship_id,
      quantity, booking_mode,
      commodity, origin_port, destination_port,
      status, payment_status,
      id
    ]
  );

  // Update shipper
  await pool.query(
    `UPDATE booking_shipper_details
     SET company_name=$1, first_name=$2, last_name=$3, phone=$4
     WHERE booking_id=$5`,
    [shipper, first_name, last_name, phone, id]
  );

  // Update consignee
  await pool.query(
    `UPDATE booking_consignee_details
     SET company_name=$1, contact_name=$2, phone=$3
     WHERE booking_id=$4`,
    [consignee, consignee_name, consignee_phone, id]
  );

  // Update pickup address
  await pool.query(
    `UPDATE booking_pickup_addresses
     SET province=$1, city=$2, barangay=$3, street=$4
     WHERE booking_id=$5`,
    [pickup_province, pickup_city, pickup_barangay, pickup_street, id]
  );

  // Update delivery address
  await pool.query(
    `UPDATE booking_delivery_addresses
     SET province=$1, city=$2, barangay=$3, street=$4
     WHERE booking_id=$5`,
    [delivery_province, delivery_city, delivery_barangay, delivery_street, id]
  );

  // Update containers
  if (container_ids.length > 0) {
    const existingContainers = await pool.query(
      `SELECT container_id FROM booking_containers WHERE booking_id=$1`,
      [id]
    );
    for (const row of existingContainers.rows) {
      await pool.query(
        `UPDATE containers SET is_returned=TRUE WHERE id=$1`,
        [row.container_id]
      );
    }
    await pool.query(`DELETE FROM booking_containers WHERE booking_id=$1`, [id]);

    for (let i = 0; i < container_ids.length; i++) {
      await pool.query(
        `INSERT INTO booking_containers (booking_id, container_id, sequence_number)
         VALUES ($1,$2,$3)`,
        [id, container_ids[i], i + 1]
      );
      await pool.query(
        `UPDATE containers SET is_returned=FALSE WHERE id=$1`,
        [container_ids[i]]
      );
    }
  }

  // Update trucking assignment
  await pool.query(
    `UPDATE booking_truck_assignments
     SET pickup_trucker_id=$1, pickup_truck_id=$2,
         delivery_trucker_id=$3, delivery_truck_id=$4,
         updated_at=NOW()
     WHERE booking_id=$5`,
    [pickup_trucker_id, pickup_truck_id, delivery_trucker_id, delivery_truck_id, id]
  );

  return result.rows[0];
};

// ================== FETCH BOOKINGS WITH TRUCKING ==================
export const getAllBookings = async () => {
  const result = await pool.query(`
    SELECT 
      b.*,
      u.email AS created_by_email,
      ud.first_name AS created_by_first_name,
      ud.last_name AS created_by_last_name,
      sl.name AS shipping_line_name,
      s.vessel_number AS ship_vessel_number,
      sh.company_name AS shipper, sh.first_name AS shipper_first_name, sh.last_name AS shipper_last_name, sh.phone AS shipper_phone,
      co.company_name AS consignee, co.contact_name AS consignee_name, co.phone AS consignee_phone,
      pa.province AS pickup_province, pa.city AS pickup_city, pa.barangay AS pickup_barangay, pa.street AS pickup_street,
      da.province AS delivery_province, da.city AS delivery_city, da.barangay AS delivery_barangay, da.street AS delivery_street,
      bta.pickup_trucker_id, pt.name AS pickup_trucker_name,
      bta.pickup_truck_id, ptk.plate_number AS pickup_truck_plate,
      bta.delivery_trucker_id, dt.name AS delivery_trucker_name,
      bta.delivery_truck_id, dtk.plate_number AS delivery_truck_plate,
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
    LEFT JOIN users u ON b.user_id=u.id
    LEFT JOIN user_details ud ON u.id=ud.user_id
    LEFT JOIN shipping_lines sl ON b.shipping_line_id=sl.id
    LEFT JOIN ships s ON b.ship_id=s.id
    LEFT JOIN booking_shipper_details sh ON b.id=sh.booking_id
    LEFT JOIN booking_consignee_details co ON b.id=co.booking_id
    LEFT JOIN booking_pickup_addresses pa ON b.id=pa.booking_id
    LEFT JOIN booking_delivery_addresses da ON b.id=da.booking_id
    LEFT JOIN booking_containers bc ON b.id=bc.booking_id
    LEFT JOIN containers c ON bc.container_id=c.id
    LEFT JOIN booking_truck_assignments bta ON b.id=bta.booking_id
    LEFT JOIN trucking_companies pt ON bta.pickup_trucker_id=pt.id
    LEFT JOIN trucks ptk ON bta.pickup_truck_id=ptk.id
    LEFT JOIN trucking_companies dt ON bta.delivery_trucker_id=dt.id
    LEFT JOIN trucks dtk ON bta.delivery_truck_id=dtk.id
    GROUP BY b.id,u.email,ud.first_name,ud.last_name,sl.name,s.vessel_number,
             sh.company_name,sh.first_name,sh.last_name,sh.phone,
             co.company_name,co.contact_name,co.phone,
             pa.province,pa.city,pa.barangay,pa.street,
             da.province,da.city,da.barangay,da.street,
             bta.pickup_trucker_id,pt.name,bta.pickup_truck_id,ptk.plate_number,
             bta.delivery_trucker_id,dt.name,bta.delivery_truck_id,dtk.plate_number
    ORDER BY b.created_at DESC
  `);
  return result.rows;
};

export const getBookingById = async id => {
  const result = await pool.query(`
    SELECT 
      b.*,
      u.email AS created_by_email,
      ud.first_name AS created_by_first_name,
      ud.last_name AS created_by_last_name,
      sl.name AS shipping_line_name,
      s.vessel_number AS ship_vessel_number,
      sh.company_name AS shipper, sh.first_name AS shipper_first_name, sh.last_name AS shipper_last_name, sh.phone AS shipper_phone,
      co.company_name AS consignee, co.contact_name AS consignee_name, co.phone AS consignee_phone,
      pa.province AS pickup_province, pa.city AS pickup_city, pa.barangay AS pickup_barangay, pa.street AS pickup_street,
      da.province AS delivery_province, da.city AS delivery_city, da.barangay AS delivery_barangay, da.street AS delivery_street,
      bta.pickup_trucker_id, pt.name AS pickup_trucker_name,
      bta.pickup_truck_id, ptk.plate_number AS pickup_truck_plate,
      bta.delivery_trucker_id, dt.name AS delivery_trucker_name,
      bta.delivery_truck_id, dtk.plate_number AS delivery_truck_plate,
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
    LEFT JOIN users u ON b.user_id=u.id
    LEFT JOIN user_details ud ON u.id=ud.user_id
    LEFT JOIN shipping_lines sl ON b.shipping_line_id=sl.id
    LEFT JOIN ships s ON b.ship_id=s.id
    LEFT JOIN booking_shipper_details sh ON b.id=sh.booking_id
    LEFT JOIN booking_consignee_details co ON b.id=co.booking_id
    LEFT JOIN booking_pickup_addresses pa ON b.id=pa.booking_id
    LEFT JOIN booking_delivery_addresses da ON b.id=da.booking_id
    LEFT JOIN booking_containers bc ON b.id=bc.booking_id
    LEFT JOIN containers c ON bc.container_id=c.id
    LEFT JOIN booking_truck_assignments bta ON b.id=bta.booking_id
    LEFT JOIN trucking_companies pt ON bta.pickup_trucker_id=pt.id
    LEFT JOIN trucks ptk ON bta.pickup_truck_id=ptk.id
    LEFT JOIN trucking_companies dt ON bta.delivery_trucker_id=dt.id
    LEFT JOIN trucks dtk ON bta.delivery_truck_id=dtk.id
    WHERE b.id=$1
    GROUP BY b.id,u.email,ud.first_name,ud.last_name,sl.name,s.vessel_number,
             sh.company_name,sh.first_name,sh.last_name,sh.phone,
             co.company_name,co.contact_name,co.phone,
             pa.province,pa.city,pa.barangay,pa.street,
             da.province,da.city,da.barangay,da.street,
             bta.pickup_trucker_id,pt.name,bta.pickup_truck_id,ptk.plate_number,
             bta.delivery_trucker_id,dt.name,bta.delivery_truck_id,dtk.plate_number
  `, [id]);
  return result.rows[0];
};

// ================== DELETE BOOKING ==================
export const deleteBooking = async id => {
  const containers = await pool.query(
    `SELECT container_id FROM booking_containers WHERE booking_id=$1`,
    [id]
  );
  for (const row of containers.rows) {
    await pool.query(
      `UPDATE containers SET is_returned=TRUE WHERE id=$1`,
      [row.container_id]
    );
  }
  await pool.query(`DELETE FROM bookings WHERE id=$1`, [id]);
  return { id };
};

// ================== STATUS HISTORY ==================
export const getBookingStatusHistory = async (bookingId) => {
  const result = await pool.query(
    `SELECT id,status,status_date,created_at
     FROM booking_status_history
     WHERE booking_id=$1
     ORDER BY status_date ASC`,
    [bookingId]
  );
  return result.rows;
};

export const addBookingStatusHistory = async (bookingId, status, statusDate = null) => {
  const result = await pool.query(
    `INSERT INTO booking_status_history (booking_id,status,status_date)
     VALUES ($1,$2,COALESCE($3,NOW()))
     RETURNING *`,
    [bookingId, status, statusDate]
  );
  return result.rows[0];
};

export const updateStatusHistoryDate = async (historyId, newDate) => {
  const result = await pool.query(
    `UPDATE booking_status_history
     SET status_date=$1
     WHERE id=$2
     RETURNING *`,
    [newDate, historyId]
  );
  return result.rows[0];
};
