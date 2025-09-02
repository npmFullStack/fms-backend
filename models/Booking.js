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
    quantity,
    freight_charge,
    trucking_charge,
    total_amount
  } = bookingData;

  const result = await pool.query(
    `INSERT INTO bookings (
      customer_id, marketing_coordinator_id, shipping_line_id, ship_id,
      container_type, booking_mode, origin, destination,
      pickup_lat, pickup_lng, delivery_lat, delivery_lng,
      preferred_departure, preferred_delivery, commodity, quantity,
      freight_charge, trucking_charge, total_amount
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
    RETURNING *`,
    [
      customer_id, marketing_coordinator_id, shipping_line_id, ship_id,
      container_type, booking_mode, origin, destination,
      pickup_lat, pickup_lng, delivery_lat, delivery_lng,
      preferred_departure, preferred_delivery, commodity, quantity,
      freight_charge, trucking_charge, total_amount
    ]
  );

  return result.rows[0];
};

// Get all bookings with related data
export const getAllBookings = async () => {
  const result = await pool.query(`
    SELECT 
      b.*,
      c.first_name as customer_first_name,
      c.last_name as customer_last_name,
      mc.first_name as coordinator_first_name,
      mc.last_name as coordinator_last_name,
      sl.name as shipping_line_name,
      s.name as ship_name
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
  const result = await pool.query(`
    SELECT 
      b.*,
      c.first_name as customer_first_name,
      c.last_name as customer_last_name,
      c.phone as customer_phone,
      mc.first_name as coordinator_first_name,
      mc.last_name as coordinator_last_name,
      sl.name as shipping_line_name,
      s.name as ship_name
    FROM bookings b
    LEFT JOIN user_details c ON b.customer_id = c.user_id
    LEFT JOIN user_details mc ON b.marketing_coordinator_id = mc.user_id
    LEFT JOIN shipping_lines sl ON b.shipping_line_id = sl.id
    LEFT JOIN ships s ON b.ship_id = s.id
    WHERE b.id = $1
  `, [id]);
  
  return result.rows[0];
};

// Update booking
export const updateBooking = async (id, bookingData) => {
  const fields = [];
  const values = [];
  let paramCount = 1;

  Object.keys(bookingData).forEach(key => {
    if (bookingData[key] !== undefined) {
      fields.push(`${key} = $${paramCount}`);
      values.push(bookingData[key]);
      paramCount++;
    }
  });

  if (fields.length === 0) {
    throw new Error("No valid fields to update");
  }

  values.push(id);
  const query = `UPDATE bookings SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} RETURNING *`;
  
  const result = await pool.query(query, values);
  return result.rows[0];
};

// Delete booking
export const deleteBooking = async (id) => {
  await pool.query('DELETE FROM bookings WHERE id = $1', [id]);
  return { id };
};

// Get bookings by customer ID
export const getBookingsByCustomerId = async (customerId) => {
  const result = await pool.query(`
    SELECT 
      b.*,
      sl.name as shipping_line_name,
      s.name as ship_name
    FROM bookings b
    LEFT JOIN shipping_lines sl ON b.shipping_line_id = sl.id
    LEFT JOIN ships s ON b.ship_id = s.id
    WHERE b.customer_id = $1
    ORDER BY b.created_at DESC
  `, [customerId]);
  
  return result.rows;
};

// Update booking status
export const updateBookingStatus = async (id, status, userId = null) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Update booking status
    const bookingResult = await client.query(
      'UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    // Add to status history
    await client.query(
      'INSERT INTO booking_status_history (booking_id, status, changed_by) VALUES ($1, $2, $3)',
      [id, status, userId]
    );
    
    await client.query('COMMIT');
    return bookingResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};