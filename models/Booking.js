// models/Booking

import { pool } from "../db/index.js";

class Booking {
  // Create new booking
  static async create(bookingData) {
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
    } = bookingData;

    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // Insert into bookings
        const bookingResult = await client.query(
            `INSERT INTO bookings (
                user_id, shipping_line_id, ship_id, quantity, booking_mode,
                commodity, origin_port, destination_port,
                booking_number, hwb_number
            )
            VALUES (
                $1, $2, $3, $4, $5,
                $6, $7, $8,
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
        await client.query(
            'INSERT INTO booking_shipper_details (booking_id, company_name, first_name, last_name, phone) VALUES ($1, $2, $3, $4, $5)',
            [booking.id, shipper, first_name, last_name, phone]
        );

        // Insert consignee details
        await client.query(
            'INSERT INTO booking_consignee_details (booking_id, company_name, contact_name, phone) VALUES ($1, $2, $3, $4)',
            [booking.id, consignee, consignee_name, consignee_phone]
        );

        // Insert pickup address
        await client.query(
            'INSERT INTO booking_pickup_addresses (booking_id, province, city, barangay, street) VALUES ($1, $2, $3, $4, $5)',
            [booking.id, pickup_province, pickup_city, pickup_barangay, pickup_street]
        );

        // Insert delivery address
        await client.query(
            'INSERT INTO booking_delivery_addresses (booking_id, province, city, barangay, street) VALUES ($1, $2, $3, $4, $5)',
            [booking.id, delivery_province, delivery_city, delivery_barangay, delivery_street]
        );

        // Insert containers
        if (container_ids.length > 0) {
            for (let i = 0; i < container_ids.length; i++) {
                await client.query(
                    'INSERT INTO booking_containers (booking_id, container_id, sequence_number) VALUES ($1, $2, $3)',
                    [booking.id, container_ids[i], i + 1]
                );
                await client.query(
                    'UPDATE containers SET is_returned=FALSE WHERE id=$1',
                    [container_ids[i]]
                );
            }
        }

        // Insert trucking assignment
        await client.query(
            'INSERT INTO booking_truck_assignments (booking_id, pickup_trucker_id, pickup_truck_id, delivery_trucker_id, delivery_truck_id) VALUES ($1, $2, $3, $4, $5)',
            [
                booking.id,
                pickup_trucker_id,
                pickup_truck_id,
                delivery_trucker_id,
                delivery_truck_id
            ]
        );

        // Create accounts receivable record
        await client.query(
            'INSERT INTO accounts_receivable (booking_id) VALUES ($1)',
            [booking.id]
        );

        // Create accounts payable record
        await client.query(
            'INSERT INTO accounts_payable (booking_id) VALUES ($1)',
            [booking.id]
        );

        await client.query('COMMIT');
        return booking;

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

  // Update booking
  static async update(id, bookingData) {
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
  }

// Get all bookings (now via the view)
static async getAll() {
  const result = await pool.query(`
    SELECT * FROM booking_summary ORDER BY created_at DESC
  `);
  return result.rows;
}

// Get booking by ID (from main table for detailed info)
static async getById(id) {
  const result = await pool.query(
    `
    SELECT * FROM booking_summary WHERE id = $1
    `,
    [id]
  );
  return result.rows[0];
}


  // Delete booking
  static async delete(id) {
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
  }

  // Get booking status history
  static async getStatusHistory(bookingId) {
    const result = await pool.query(
      `SELECT id, status, status_date, created_at
       FROM booking_status_history
       WHERE booking_id=$1
       ORDER BY status_date ASC`,
      [bookingId]
    );
    return result.rows;
  }

  // Add booking status history
  static async addStatusHistory(bookingId, status, statusDate = null) {
    // Insert into history table
    const historyResult = await pool.query(
      `INSERT INTO booking_status_history (booking_id, status, status_date)
       VALUES ($1, $2, COALESCE($3, NOW()))
       RETURNING *`,
      [bookingId, status, statusDate]
    );
    
    // Update the main booking status
    await pool.query(
      `UPDATE bookings 
       SET status = $1, updated_at = NOW()
       WHERE id = $2`,
      [status, bookingId]
    );
    
    return historyResult.rows[0];
  }

  // Update status history date
  static async updateStatusHistoryDate(historyId, newDate) {
    // Update the history entry
    const historyResult = await pool.query(
      `UPDATE booking_status_history
       SET status_date = $1
       WHERE id = $2
       RETURNING *`,
      [newDate, historyId]
    );
    
    if (historyResult.rows.length === 0) {
      throw new Error('History entry not found');
    }
    
    const updatedHistory = historyResult.rows[0];
    
    // Update the main booking status as well
    await pool.query(
      `UPDATE bookings 
       SET status = $1, updated_at = NOW()
       WHERE id = $2`,
      [updatedHistory.status, updatedHistory.booking_id]
    );
    
    return updatedHistory;
  }

  // Find booking by number or HWB
  static async findByNumberOrHwb(query) {
    const result = await pool.query(
      `
      SELECT   
        b.*,  
        sl.name AS shipping_line_name,  
        s.vessel_number AS ship_vessel_number,  
        s.ship_name  
      FROM bookings b  
      LEFT JOIN shipping_lines sl ON b.shipping_line_id = sl.id  
      LEFT JOIN ships s ON b.ship_id = s.id  
      WHERE UPPER(TRIM(b.booking_number)) = UPPER(TRIM($1))   
         OR UPPER(TRIM(b.hwb_number)) = UPPER(TRIM($1))  
      LIMIT 1
      `,
      [query]
    );
    return result.rows[0] || null;
  }
}

export default Booking;