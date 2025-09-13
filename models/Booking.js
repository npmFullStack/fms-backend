import { pool } from "../db/index.js";

// Create a new booking
export const createBooking = async (bookingData) => {
  const {
    user_id,
    booking_date,
    shipper,
    first_name,
    last_name,
    phone,
    shipping_line_id,
    ship_id,
    container_id,
    quantity,
    booking_mode,
    commodity,
    origin_port,
    destination_port,
    pickup_lat,
    pickup_lng,
    delivery_lat,
    delivery_lng,
    preferred_departure,
    preferred_delivery,
  } = bookingData;

  const result = await pool.query(
    `INSERT INTO bookings (
      user_id, booking_date, shipper, first_name, last_name, phone,
      shipping_line_id, ship_id, container_id, quantity, booking_mode,
      commodity, origin_port, destination_port,
      pickup_lat, pickup_lng, delivery_lat, delivery_lng,
      preferred_departure, preferred_delivery,
      booking_number, hwb_number
    )
    VALUES (
      $1,$2,$3,$4,$5,$6,
      $7,$8,$9,$10,$11,
      $12,$13,$14,
      $15,$16,$17,$18,
      $19,$20,
      'BKG-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('booking_number_seq')::text, 5, '0'),
      'HWB-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('hwb_number_seq')::text, 5, '0')
    )
    RETURNING *`,
    [
      user_id,
      booking_date,
      shipper,
      first_name,
      last_name,
      phone,
      shipping_line_id,
      ship_id,
      container_id,
      quantity,
      booking_mode,
      commodity,
      origin_port,
      destination_port,
      pickup_lat,
      pickup_lng,
      delivery_lat,
      delivery_lng,
      preferred_departure,
      preferred_delivery,
    ]
  );

  return result.rows[0];
};

// Get all bookings with related data
export const getAllBookings = async () => {
  const result = await pool.query(`
    SELECT 
      b.*,
      u.email AS created_by_email,
      ud.first_name AS created_by_first_name,
      ud.last_name AS created_by_last_name,
      sl.name AS shipping_line_name,
      s.vessel_number AS ship_vessel_number,
      c.size AS container_size,
      c.van_number AS container_van_number
    FROM bookings b
    LEFT JOIN users u ON b.user_id = u.id
    LEFT JOIN user_details ud ON u.id = ud.user_id
    LEFT JOIN shipping_lines sl ON b.shipping_line_id = sl.id
    LEFT JOIN ships s ON b.ship_id = s.id
    LEFT JOIN containers c ON b.container_id = c.id
    ORDER BY b.created_at DESC
  `);
  return result.rows;
};

// Get booking by ID
export const getBookingById = async (id) => {
  const result = await pool.query(
    `
    SELECT 
      b.*,
      u.email AS created_by_email,
      ud.first_name AS created_by_first_name,
      ud.last_name AS created_by_last_name,
      sl.name AS shipping_line_name,
      s.vessel_number AS ship_vessel_number,
      c.size AS container_size,
      c.van_number AS container_van_number
    FROM bookings b
    LEFT JOIN users u ON b.user_id = u.id
    LEFT JOIN user_details ud ON u.id = ud.user_id
    LEFT JOIN shipping_lines sl ON b.shipping_line_id = sl.id
    LEFT JOIN ships s ON b.ship_id = s.id
    LEFT JOIN containers c ON b.container_id = c.id
    WHERE b.id = $1
  `,
    [id]
  );

  return result.rows[0];
};

// Update booking
export const updateBooking = async (id, bookingData) => {
  const {
    booking_date,
    shipper,
    first_name,
    last_name,
    phone,
    shipping_line_id,
    ship_id,
    container_id,
    quantity,
    booking_mode,
    commodity,
    origin_port,
    destination_port,
    pickup_lat,
    pickup_lng,
    delivery_lat,
    delivery_lng,
    preferred_departure,
    preferred_delivery,
    status,
    payment_status,
  } = bookingData;

  const result = await pool.query(
    `UPDATE bookings SET
      booking_date = $1,
      shipper = $2,
      first_name = $3,
      last_name = $4,
      phone = $5,
      shipping_line_id = $6,
      ship_id = $7,
      container_id = $8,
      quantity = $9,
      booking_mode = $10,
      commodity = $11,
      origin_port = $12,
      destination_port = $13,
      pickup_lat = $14,
      pickup_lng = $15,
      delivery_lat = $16,
      delivery_lng = $17,
      preferred_departure = $18,
      preferred_delivery = $19,
      status = $20,
      payment_status = $21,
      updated_at = NOW()
    WHERE id = $22
    RETURNING *`,
    [
      booking_date,
      shipper,
      first_name,
      last_name,
      phone,
      shipping_line_id,
      ship_id,
      container_id,
      quantity,
      booking_mode,
      commodity,
      origin_port,
      destination_port,
      pickup_lat,
      pickup_lng,
      delivery_lat,
      delivery_lng,
      preferred_departure,
      preferred_delivery,
      status,
      payment_status,
      id,
    ]
  );

  return result.rows[0];
};

// Delete booking
export const deleteBooking = async (id) => {
  await pool.query("DELETE FROM bookings WHERE id = $1", [id]);
  return { id };
};
