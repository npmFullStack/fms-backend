import { pool } from "../db/index.js";

class AP {


  // Get AP by booking ID
  static async getByBookingId(bookingId) {
    const query = `
      SELECT * FROM accounts_payable 
      WHERE booking_id = $1;
    `;
    
    const result = await pool.query(query, [bookingId]);
    return result.rows[0];
  }

  // Get all AP summaries with booking data and payee information
  static async getAllSummaries() {
    const query = `
      SELECT 
        ap.id as ap_id,
        ap.booking_id,
        b.booking_number,
        b.hwb_number,
        b.origin_port,
        b.destination_port,
        b.commodity,
        b.quantity,
        b.booking_mode,
        b.status as booking_status,
        
        -- Shipping line as freight payee
        sl.name as freight_payee,
        -- Freight charges
        COALESCE(af.amount, 0) as freight_amount,
        af.check_date as freight_check_date,
        af.voucher as freight_voucher,
        
        -- Trucking companies as payees
        pt.name as trucking_origin_payee,
        COALESCE(ato.amount, 0) as trucking_origin_amount,
        ato.check_date as trucking_origin_check_date,
        ato.voucher as trucking_origin_voucher,
        
        dt.name as trucking_dest_payee,
        COALESCE(atd.amount, 0) as trucking_dest_amount,
        atd.check_date as trucking_dest_check_date,
        atd.voucher as trucking_dest_voucher,
        
        -- Port charges payees (you can add these from your port charge tables if needed)
        COALESCE(apc1.payee, '') as crainage_payee,
        COALESCE(apc1.amount, 0) as crainage_amount,
        apc1.check_date as crainage_check_date,
        apc1.voucher as crainage_voucher,
        
        -- Calculate total expenses
        (COALESCE(af.amount, 0) + 
         COALESCE(ato.amount, 0) + 
         COALESCE(atd.amount, 0) +
         COALESCE(apc1.amount, 0)) as total_expenses,
         
        -- Net revenue calculation (you might want to add your revenue logic)
        0 as net_revenue

      FROM accounts_payable ap
      INNER JOIN bookings b ON ap.booking_id = b.id
      LEFT JOIN shipping_lines sl ON b.shipping_line_id = sl.id
      LEFT JOIN booking_truck_assignments bta ON b.id = bta.booking_id
      LEFT JOIN trucking_companies pt ON bta.pickup_trucker_id = pt.id
      LEFT JOIN trucking_companies dt ON bta.delivery_trucker_id = dt.id
      LEFT JOIN ap_freight af ON ap.id = af.ap_id
      LEFT JOIN ap_trucking ato ON ap.id = ato.ap_id AND ato.type = 'ORIGIN'
      LEFT JOIN ap_trucking atd ON ap.id = atd.ap_id AND atd.type = 'DESTINATION'
      LEFT JOIN ap_port_charges apc1 ON ap.id = apc1.ap_id AND apc1.charge_type = 'CRAINAGE'
      ORDER BY b.created_at DESC;
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }

  // Get AP by ID with full details including payees
  static async getById(apId) {
    const query = `
      SELECT 
        ap.*,
        b.*,
        sl.name as freight_payee,
        pt.name as trucking_origin_payee,
        dt.name as trucking_dest_payee,
        
        af.amount as freight_amount,
        af.check_date as freight_check_date,
        af.voucher as freight_voucher,
        
        ato.amount as trucking_origin_amount,
        ato.check_date as trucking_origin_check_date,
        ato.voucher as trucking_origin_voucher,
        
        atd.amount as trucking_dest_amount,
        atd.check_date as trucking_dest_check_date,
        atd.voucher as trucking_dest_voucher,

        -- Route information
        CONCAT(b.origin_port, ' → ', b.destination_port) as route

      FROM accounts_payable ap
      INNER JOIN bookings b ON ap.booking_id = b.id
      LEFT JOIN shipping_lines sl ON b.shipping_line_id = sl.id
      LEFT JOIN booking_truck_assignments bta ON b.id = bta.booking_id
      LEFT JOIN trucking_companies pt ON bta.pickup_trucker_id = pt.id
      LEFT JOIN trucking_companies dt ON bta.delivery_trucker_id = dt.id
      LEFT JOIN ap_freight af ON ap.id = af.ap_id
      LEFT JOIN ap_trucking ato ON ap.id = ato.ap_id AND ato.type = 'ORIGIN'
      LEFT JOIN ap_trucking atd ON ap.id = atd.ap_id AND atd.type = 'DESTINATION'
      WHERE ap.id = $1;
    `;
    
    const result = await pool.query(query, [apId]);
    return result.rows[0];
  }

  // Update AP record
  static async update(apId, data) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Update freight
      if (data.freight_amount !== undefined) {
        const freightQuery = `
          INSERT INTO ap_freight (ap_id, amount, check_date, voucher)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (ap_id) 
          DO UPDATE SET 
            amount = EXCLUDED.amount,
            check_date = EXCLUDED.check_date,
            voucher = EXCLUDED.voucher,
            updated_at = NOW()
        `;
        await client.query(freightQuery, [
          apId,
          data.freight_amount,
          data.freight_check_date,
          data.freight_voucher
        ]);
      }

      // Update trucking origin
      if (data.trucking_origin_amount !== undefined) {
        const truckingOriginQuery = `
          INSERT INTO ap_trucking (ap_id, type, amount, check_date, voucher)
          VALUES ($1, 'ORIGIN', $2, $3, $4)
          ON CONFLICT (ap_id, type) 
          DO UPDATE SET 
            amount = EXCLUDED.amount,
            check_date = EXCLUDED.check_date,
            voucher = EXCLUDED.voucher,
            updated_at = NOW()
        `;
        await client.query(truckingOriginQuery, [
          apId,
          data.trucking_origin_amount,
          data.trucking_origin_check_date,
          data.trucking_origin_voucher
        ]);
      }

      // Update trucking destination
      if (data.trucking_dest_amount !== undefined) {
        const truckingDestQuery = `
          INSERT INTO ap_trucking (ap_id, type, amount, check_date, voucher)
          VALUES ($1, 'DESTINATION', $2, $3, $4)
          ON CONFLICT (ap_id, type) 
          DO UPDATE SET 
            amount = EXCLUDED.amount,
            check_date = EXCLUDED.check_date,
            voucher = EXCLUDED.voucher,
            updated_at = NOW()
        `;
        await client.query(truckingDestQuery, [
          apId,
          data.trucking_dest_amount,
          data.trucking_dest_check_date,
          data.trucking_dest_voucher
        ]);
      }

      await client.query('COMMIT');
      
      // Return updated record
      return await this.getById(apId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  

static async getByBookingNumber(bookingNumber) {
    const query = `
      SELECT 
        ap.*,
        b.*,
        sl.name as freight_payee,
        pt.name as trucking_origin_payee,
        dt.name as trucking_dest_payee,
        
        af.amount as freight_amount,
        af.check_date as freight_check_date,
        af.voucher as freight_voucher,
        
        ato.amount as trucking_origin_amount,
        ato.check_date as trucking_origin_check_date,
        ato.voucher as trucking_origin_voucher,
        
        atd.amount as trucking_dest_amount,
        atd.check_date as trucking_dest_check_date,
        atd.voucher as trucking_dest_voucher

      FROM accounts_payable ap
      INNER JOIN bookings b ON ap.booking_id = b.id
      LEFT JOIN shipping_lines sl ON b.shipping_line_id = sl.id
      LEFT JOIN booking_truck_assignments bta ON b.id = bta.booking_id
      LEFT JOIN trucking_companies pt ON bta.pickup_trucker_id = pt.id
      LEFT JOIN trucking_companies dt ON bta.delivery_trucker_id = dt.id
      LEFT JOIN ap_freight af ON ap.id = af.ap_id
      LEFT JOIN ap_trucking ato ON ap.id = ato.ap_id AND ato.type = 'ORIGIN'
      LEFT JOIN ap_trucking atd ON ap.id = atd.ap_id AND atd.type = 'DESTINATION'
      WHERE b.booking_number = $1 OR b.hwb_number = $1;
    `;
    
    const result = await pool.query(query, [bookingNumber]);
    return result.rows[0];
}
}

export default AP;