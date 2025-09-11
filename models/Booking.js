import { pool } from "../db/index.js";

// Create a new booking
export const createBooking = async (bookingData) => {
  const {
    customer_id,
    marketing_coordinator_id,
    shipping_line_id,
    ship_id,
    container_type,
    booking_mode,
    origin,
    destination,
    pickup_lat,
    pickup_lng,
    delivery_lat,
    delivery_lng,
    preferred_departure,
    preferred_delivery,
    commodity,
    quantity
  } = bookingData;

  const result = await pool.query(
    `INSERT INTO bookings (
      customer_id, marketing_coordinator_id, shipping_line_id, ship_id,
      container_type, booking_mode, origin, destination,
      pickup_lat, pickup_lng, delivery_lat, delivery_lng,
      preferred_departure, preferred_delivery, commodity, quantity
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
    RETURNING 
      id,
      booking_number,
      hwb_number,
      customer_id,
      marketing_coordinator_id,
      shipping_line_id,
      ship_id,
      container_type,
      booking_mode,
      origin,
      destination,
      pickup_lat,
      pickup_lng,
      delivery_lat,
      delivery_lng,
      preferred_departure,
      preferred_delivery,
      commodity,
      quantity,
      status,
      payment_status,
      created_at,
      updated_at`,
    [
      customer_id, marketing_coordinator_id, shipping_line_id, ship_id,
      container_type, booking_mode, origin, destination,
      pickup_lat, pickup_lng, delivery_lat, delivery_lng,
      preferred_departure, preferred_delivery, commodity, quantity
    ]
  );

  return result.rows[0]; 
};

// Get all bookings with related data
export const getAllBookings = async () => {
  const result = await pool.query(`
    SELECT 
      b.*,
      c.first_name AS customer_first_name,
      c.last_name AS customer_last_name,
      mc.first_name AS coordinator_first_name,
      mc.last_name AS coordinator_last_name,
      sl.name AS shipping_line_name,
      s.vessel_number AS ship_vessel_number
    FROM bookings b
    LEFT JOIN user_details c ON b.customer_id = c.user_id
    LEFT JOIN user_details mc ON b.marketing_coordinator_id = mc.user_id
    LEFT JOIN shipping_lines sl ON b.shipping_line_id = sl.id
    LEFT JOIN ships s ON b.ship_id = s.id
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
      c.first_name AS customer_first_name,
      c.last_name AS customer_last_name,
      c.phone AS customer_phone,
      mc.first_name AS coordinator_first_name,
      mc.last_name AS coordinator_last_name,
      sl.name AS shipping_line_name,
      s.vessel_number AS ship_vessel_number
    FROM bookings b
    LEFT JOIN user_details c ON b.customer_id = c.user_id
    LEFT JOIN user_details mc ON b.marketing_coordinator_id = mc.user_id
    LEFT JOIN shipping_lines sl ON b.shipping_line_id = sl.id
    LEFT JOIN ships s ON b.ship_id = s.id
    WHERE b.id = $1
  `,
    [id]
  );

  return result.rows[0];
};

// Update booking
export const updateBooking = async (id, bookingData) => {
  const {
    shipping_line_id,
    ship_id,
    container_type,
    booking_mode,
    origin,
    destination,
    pickup_lat,
    pickup_lng,
    delivery_lat,
    delivery_lng,
    preferred_departure,
    preferred_delivery,
    commodity,
    quantity,
    status,
    payment_status
  } = bookingData;

  const result = await pool.query(
    `UPDATE bookings SET
      shipping_line_id = $1,
      ship_id = $2,
      container_type = $3,
      booking_mode = $4,
      origin = $5,
      destination = $6,
      pickup_lat = $7,
      pickup_lng = $8,
      delivery_lat = $9,
      delivery_lng = $10,
      preferred_departure = $11,
      preferred_delivery = $12,
      commodity = $13,
      quantity = $14,
      status = $15,
      payment_status = $16,
      updated_at = NOW()
    WHERE id = $17
    RETURNING *`,
    [
      shipping_line_id,
      ship_id,
      container_type,
      booking_mode,
      origin,
      destination,
      pickup_lat,
      pickup_lng,
      delivery_lat,
      delivery_lng,
      preferred_departure,
      preferred_delivery,
      commodity,
      quantity,
      status,
      payment_status,
      id
    ]
  );

  return result.rows[0];
};

// Delete booking
export const deleteBooking = async (id) => {
  await pool.query("DELETE FROM bookings WHERE id = $1", [id]);
  return { id };
};
