import { pool } from "../db/index.js";

class Courier {
    // Find booking by booking number or HWB number with ALL related data
    static async findByNumberOrHwb(query) {
        const result = await pool.query(
            `SELECT
                b.*,
                sl.name AS shipping_line_name,
                s.vessel_number AS ship_vessel_number,
                s.ship_name,
                
                -- Shipper details
                sd.company_name AS shipper,
                sd.first_name AS shipper_first_name,
                sd.last_name AS shipper_last_name,
                sd.phone AS shipper_phone,
                
                -- Consignee details
                cd.company_name AS consignee,
                cd.contact_name AS consignee_name,
                cd.phone AS consignee_phone,
                
                -- Pickup address
                pa.province AS pickup_province,
                pa.city AS pickup_city,
                pa.barangay AS pickup_barangay,
                pa.street AS pickup_street,
                
                -- Delivery address
                da.province AS delivery_province,
                da.city AS delivery_city,
                da.barangay AS delivery_barangay,
                da.street AS delivery_street,
                
                -- Trucking info
                pt.name AS pickup_trucker,
                dt.name AS delivery_trucker
                
            FROM bookings b
            LEFT JOIN shipping_lines sl ON b.shipping_line_id = sl.id
            LEFT JOIN ships s ON b.ship_id = s.id
            LEFT JOIN booking_shipper_details sd ON b.id = sd.booking_id
            LEFT JOIN booking_consignee_details cd ON b.id = cd.booking_id
            LEFT JOIN booking_pickup_addresses pa ON b.id = pa.booking_id
            LEFT JOIN booking_delivery_addresses da ON b.id = da.booking_id
            LEFT JOIN booking_truck_assignments bta ON b.id = bta.booking_id
            LEFT JOIN trucking_companies pt ON bta.pickup_trucker_id = pt.id
            LEFT JOIN trucking_companies dt ON bta.delivery_trucker_id = dt.id
            
            WHERE UPPER(TRIM(b.booking_number)) = UPPER(TRIM($1))
                OR UPPER(TRIM(b.hwb_number)) = UPPER(TRIM($1))
            LIMIT 1`,
            [query]
        );
        return result.rows[0] || null;
    }

    // Update booking status
    static async updateStatus(id, status) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            // Update booking status
            const bookingResult = await client.query(
                `UPDATE bookings 
                SET status = $1, updated_at = NOW() 
                WHERE id = $2 
                RETURNING *`,
                [status, id]
            );

            const booking = bookingResult.rows[0];
            if (!booking) {
                await client.query('ROLLBACK');
                return null;
            }

            // Log status history
            await client.query(
                `INSERT INTO booking_status_history (booking_id, status, status_date) 
                VALUES ($1, $2, NOW())`,
                [id, status]
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

    // Get booking status history
    static async getStatusHistory(bookingId) {
        const result = await pool.query(
            `SELECT status, status_date 
            FROM booking_status_history 
            WHERE booking_id = $1 
            ORDER BY status_date ASC`,
            [bookingId]
        );
        return result.rows;
    }
    
 
static async addIncident({ imageUrl, description, bookingId, totalCost }) {
  const result = await pool.query(
    `INSERT INTO incidents (image_url, type, description, booking_id, total_cost)
     VALUES ($1, 'LAND', $2, $3, $4)
     RETURNING *`,
    [imageUrl, description, bookingId, totalCost]
  );
  return result.rows[0];
}


}

export default Courier;