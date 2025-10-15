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
        
        -- New AP financial fields
        ap.bir_percentage,
        ap.total_expenses,
        ap.total_payables,
        
        -- AR financial fields (linked through booking_id)
        ar.gross_income,
        ar.collectible_amount,
        ar.net_revenue_percentage,
        
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
        
        -- Port charges
        COALESCE(apc1.payee, '') as crainage_payee,
        COALESCE(apc1.amount, 0) as crainage_amount,
        apc1.check_date as crainage_check_date,
        apc1.voucher as crainage_voucher,

        COALESCE(apc2.payee, '') as arrastre_origin_payee,
        COALESCE(apc2.amount, 0) as arrastre_origin_amount,
        apc2.check_date as arrastre_origin_check_date,
        apc2.voucher as arrastre_origin_voucher,

        COALESCE(apc3.payee, '') as arrastre_dest_payee,
        COALESCE(apc3.amount, 0) as arrastre_dest_amount,
        apc3.check_date as arrastre_dest_check_date,
        apc3.voucher as arrastre_dest_voucher,

        COALESCE(apc4.payee, '') as wharfage_origin_payee,
        COALESCE(apc4.amount, 0) as wharfage_origin_amount,
        apc4.check_date as wharfage_origin_check_date,
        apc4.voucher as wharfage_origin_voucher,

        COALESCE(apc5.payee, '') as wharfage_dest_payee,
        COALESCE(apc5.amount, 0) as wharfage_dest_amount,
        apc5.check_date as wharfage_dest_check_date,
        apc5.voucher as wharfage_dest_voucher,

        COALESCE(apc6.payee, '') as labor_origin_payee,
        COALESCE(apc6.amount, 0) as labor_origin_amount,
        apc6.check_date as labor_origin_check_date,
        apc6.voucher as labor_origin_voucher,

        COALESCE(apc7.payee, '') as labor_dest_payee,
        COALESCE(apc7.amount, 0) as labor_dest_amount,
        apc7.check_date as labor_dest_check_date,
        apc7.voucher as labor_dest_voucher,

        -- Misc charges
        COALESCE(amc1.payee, '') as rebates_payee,
        COALESCE(amc1.amount, 0) as rebates_amount,
        amc1.check_date as rebates_check_date,
        amc1.voucher as rebates_voucher,

        COALESCE(amc2.payee, '') as storage_payee,
        COALESCE(amc2.amount, 0) as storage_amount,
        amc2.check_date as storage_check_date,
        amc2.voucher as storage_voucher,

        COALESCE(amc3.payee, '') as facilitation_payee,
        COALESCE(amc3.amount, 0) as facilitation_amount,
        amc3.check_date as facilitation_check_date,
        amc3.voucher as facilitation_voucher,
        
        -- Calculate total expenses from all charges
        (COALESCE(af.amount, 0) + 
         COALESCE(ato.amount, 0) + 
         COALESCE(atd.amount, 0) +
         COALESCE(apc1.amount, 0) +
         COALESCE(apc2.amount, 0) +
         COALESCE(apc3.amount, 0) +
         COALESCE(apc4.amount, 0) +
         COALESCE(apc5.amount, 0) +
         COALESCE(apc6.amount, 0) +
         COALESCE(apc7.amount, 0) +
         COALESCE(amc1.amount, 0) +
         COALESCE(amc2.amount, 0) +
         COALESCE(amc3.amount, 0)) as calculated_total_expenses

      FROM accounts_payable ap
      INNER JOIN bookings b ON ap.booking_id = b.id
      LEFT JOIN accounts_receivable ar ON b.id = ar.booking_id
      LEFT JOIN shipping_lines sl ON b.shipping_line_id = sl.id
      LEFT JOIN booking_truck_assignments bta ON b.id = bta.booking_id
      LEFT JOIN trucking_companies pt ON bta.pickup_trucker_id = pt.id
      LEFT JOIN trucking_companies dt ON bta.delivery_trucker_id = dt.id
      LEFT JOIN ap_freight af ON ap.id = af.ap_id
      LEFT JOIN ap_trucking ato ON ap.id = ato.ap_id AND ato.type = 'ORIGIN'
      LEFT JOIN ap_trucking atd ON ap.id = atd.ap_id AND atd.type = 'DESTINATION'
      LEFT JOIN ap_port_charges apc1 ON ap.id = apc1.ap_id AND apc1.charge_type = 'CRAINAGE'
      LEFT JOIN ap_port_charges apc2 ON ap.id = apc2.ap_id AND apc2.charge_type = 'ARRASTRE_ORIGIN'
      LEFT JOIN ap_port_charges apc3 ON ap.id = apc3.ap_id AND apc3.charge_type = 'ARRASTRE_DEST'
      LEFT JOIN ap_port_charges apc4 ON ap.id = apc4.ap_id AND apc4.charge_type = 'WHARFAGE_ORIGIN'
      LEFT JOIN ap_port_charges apc5 ON ap.id = apc5.ap_id AND apc5.charge_type = 'WHARFAGE_DEST'
      LEFT JOIN ap_port_charges apc6 ON ap.id = apc6.ap_id AND apc6.charge_type = 'LABOR_ORIGIN'
      LEFT JOIN ap_port_charges apc7 ON ap.id = apc7.ap_id AND apc7.charge_type = 'LABOR_DEST'
      LEFT JOIN ap_misc_charges amc1 ON ap.id = amc1.ap_id AND amc1.charge_type = 'REBATES'
      LEFT JOIN ap_misc_charges amc2 ON ap.id = amc2.ap_id AND amc2.charge_type = 'STORAGE'
      LEFT JOIN ap_misc_charges amc3 ON ap.id = amc3.ap_id AND amc3.charge_type = 'FACILITATION'
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
        
        -- New AP financial fields
        ap.bir_percentage,
        ap.total_expenses,
        ap.total_payables,
        
        -- AR financial fields (linked through booking_id)
        ar.gross_income,
        ar.collectible_amount,
        ar.net_revenue_percentage,
        
        af.amount as freight_amount,
        af.check_date as freight_check_date,
        af.voucher as freight_voucher,
        
        ato.amount as trucking_origin_amount,
        ato.check_date as trucking_origin_check_date,
        ato.voucher as trucking_origin_voucher,
        
        atd.amount as trucking_dest_amount,
        atd.check_date as trucking_dest_check_date,
        atd.voucher as trucking_dest_voucher,

        -- Port charges
        (SELECT amount FROM ap_port_charges WHERE ap_id = ap.id AND charge_type = 'CRAINAGE') as crainage_amount,
        (SELECT check_date FROM ap_port_charges WHERE ap_id = ap.id AND charge_type = 'CRAINAGE') as crainage_check_date,
        (SELECT voucher FROM ap_port_charges WHERE ap_id = ap.id AND charge_type = 'CRAINAGE') as crainage_voucher,

        (SELECT amount FROM ap_port_charges WHERE ap_id = ap.id AND charge_type = 'ARRASTRE_ORIGIN') as arrastre_origin_amount,
        (SELECT check_date FROM ap_port_charges WHERE ap_id = ap.id AND charge_type = 'ARRASTRE_ORIGIN') as arrastre_origin_check_date,
        (SELECT voucher FROM ap_port_charges WHERE ap_id = ap.id AND charge_type = 'ARRASTRE_ORIGIN') as arrastre_origin_voucher,

        (SELECT amount FROM ap_port_charges WHERE ap_id = ap.id AND charge_type = 'ARRASTRE_DEST') as arrastre_dest_amount,
        (SELECT check_date FROM ap_port_charges WHERE ap_id = ap.id AND charge_type = 'ARRASTRE_DEST') as arrastre_dest_check_date,
        (SELECT voucher FROM ap_port_charges WHERE ap_id = ap.id AND charge_type = 'ARRASTRE_DEST') as arrastre_dest_voucher,

        (SELECT amount FROM ap_port_charges WHERE ap_id = ap.id AND charge_type = 'WHARFAGE_ORIGIN') as wharfage_origin_amount,
        (SELECT check_date FROM ap_port_charges WHERE ap_id = ap.id AND charge_type = 'WHARFAGE_ORIGIN') as wharfage_origin_check_date,
        (SELECT voucher FROM ap_port_charges WHERE ap_id = ap.id AND charge_type = 'WHARFAGE_ORIGIN') as wharfage_origin_voucher,

        (SELECT amount FROM ap_port_charges WHERE ap_id = ap.id AND charge_type = 'WHARFAGE_DEST') as wharfage_dest_amount,
        (SELECT check_date FROM ap_port_charges WHERE ap_id = ap.id AND charge_type = 'WHARFAGE_DEST') as wharfage_dest_check_date,
        (SELECT voucher FROM ap_port_charges WHERE ap_id = ap.id AND charge_type = 'WHARFAGE_DEST') as wharfage_dest_voucher,

        (SELECT amount FROM ap_port_charges WHERE ap_id = ap.id AND charge_type = 'LABOR_ORIGIN') as labor_origin_amount,
        (SELECT check_date FROM ap_port_charges WHERE ap_id = ap.id AND charge_type = 'LABOR_ORIGIN') as labor_origin_check_date,
        (SELECT voucher FROM ap_port_charges WHERE ap_id = ap.id AND charge_type = 'LABOR_ORIGIN') as labor_origin_voucher,

        (SELECT amount FROM ap_port_charges WHERE ap_id = ap.id AND charge_type = 'LABOR_DEST') as labor_dest_amount,
        (SELECT check_date FROM ap_port_charges WHERE ap_id = ap.id AND charge_type = 'LABOR_DEST') as labor_dest_check_date,
        (SELECT voucher FROM ap_port_charges WHERE ap_id = ap.id AND charge_type = 'LABOR_DEST') as labor_dest_voucher,

        -- Misc charges
        (SELECT amount FROM ap_misc_charges WHERE ap_id = ap.id AND charge_type = 'REBATES') as rebates_amount,
        (SELECT check_date FROM ap_misc_charges WHERE ap_id = ap.id AND charge_type = 'REBATES') as rebates_check_date,
        (SELECT voucher FROM ap_misc_charges WHERE ap_id = ap.id AND charge_type = 'REBATES') as rebates_voucher,

        (SELECT amount FROM ap_misc_charges WHERE ap_id = ap.id AND charge_type = 'STORAGE') as storage_amount,
        (SELECT check_date FROM ap_misc_charges WHERE ap_id = ap.id AND charge_type = 'STORAGE') as storage_check_date,
        (SELECT voucher FROM ap_misc_charges WHERE ap_id = ap.id AND charge_type = 'STORAGE') as storage_voucher,

        (SELECT amount FROM ap_misc_charges WHERE ap_id = ap.id AND charge_type = 'FACILITATION') as facilitation_amount,
        (SELECT check_date FROM ap_misc_charges WHERE ap_id = ap.id AND charge_type = 'FACILITATION') as facilitation_check_date,
        (SELECT voucher FROM ap_misc_charges WHERE ap_id = ap.id AND charge_type = 'FACILITATION') as facilitation_voucher,

        -- Route information
        CONCAT(b.origin_port, ' → ', b.destination_port) as route

      FROM accounts_payable ap
      INNER JOIN bookings b ON ap.booking_id = b.id
      LEFT JOIN accounts_receivable ar ON b.id = ar.booking_id
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

      // Update the main AP record with expense data
      const updateAPQuery = `
        UPDATE accounts_payable 
        SET bir_percentage = $1,
            total_expenses = $2,
            total_payables = $3,
            updated_at = NOW()
        WHERE id = $4
      `;

      await client.query(updateAPQuery, [
        data.bir_percentage || 0,
        data.total_expenses || 0,
        data.total_payables || 0,
        apId
      ]);

      // ✅ UPDATED: Update corresponding AR record with revenue data including collectible_amount calculation
      const updateARQuery = `
        UPDATE accounts_receivable 
        SET gross_income = $1,
            collectible_amount = $1 - amount_paid,  -- ✅ Calculate collectible_amount as gross_income minus payments
            net_revenue_percentage = $2,
            updated_at = NOW()
        WHERE booking_id = (
          SELECT booking_id FROM accounts_payable WHERE id = $3
        )
      `;
      
      await client.query(updateARQuery, [
        data.gross_income || 0,
        data.net_revenue_percentage || 0,
        apId
      ]);

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

      // Update port charges
      const portChargeTypes = [
        { type: 'CRAINAGE', amount: data.crainage_amount, check_date: data.crainage_check_date, voucher: data.crainage_voucher },
        { type: 'ARRASTRE_ORIGIN', amount: data.arrastre_origin_amount, check_date: data.arrastre_origin_check_date, voucher: data.arrastre_origin_voucher },
        { type: 'ARRASTRE_DEST', amount: data.arrastre_dest_amount, check_date: data.arrastre_dest_check_date, voucher: data.arrastre_dest_voucher },
        { type: 'WHARFAGE_ORIGIN', amount: data.wharfage_origin_amount, check_date: data.wharfage_origin_check_date, voucher: data.wharfage_origin_voucher },
        { type: 'WHARFAGE_DEST', amount: data.wharfage_dest_amount, check_date: data.wharfage_dest_check_date, voucher: data.wharfage_dest_voucher },
        { type: 'LABOR_ORIGIN', amount: data.labor_origin_amount, check_date: data.labor_origin_check_date, voucher: data.labor_origin_voucher },
        { type: 'LABOR_DEST', amount: data.labor_dest_amount, check_date: data.labor_dest_check_date, voucher: data.labor_dest_voucher }
      ];

      for (const charge of portChargeTypes) {
        if (charge.amount !== undefined) {
          const portChargeQuery = `
            INSERT INTO ap_port_charges (ap_id, charge_type, amount, check_date, voucher)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (ap_id, charge_type) 
            DO UPDATE SET 
              amount = EXCLUDED.amount,
              check_date = EXCLUDED.check_date,
              voucher = EXCLUDED.voucher,
              updated_at = NOW()
          `;
          await client.query(portChargeQuery, [
            apId,
            charge.type,
            charge.amount,
            charge.check_date,
            charge.voucher
          ]);
        }
      }

      // Update misc charges
      const miscChargeTypes = [
        { type: 'REBATES', amount: data.rebates_amount, check_date: data.rebates_check_date, voucher: data.rebates_voucher },
        { type: 'STORAGE', amount: data.storage_amount, check_date: data.storage_check_date, voucher: data.storage_voucher },
        { type: 'FACILITATION', amount: data.facilitation_amount, check_date: data.facilitation_check_date, voucher: data.facilitation_voucher }
      ];

      for (const charge of miscChargeTypes) {
        if (charge.amount !== undefined) {
          const miscChargeQuery = `
            INSERT INTO ap_misc_charges (ap_id, charge_type, amount, check_date, voucher)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (ap_id, charge_type) 
            DO UPDATE SET 
              amount = EXCLUDED.amount,
              check_date = EXCLUDED.check_date,
              voucher = EXCLUDED.voucher,
              updated_at = NOW()
          `;
          await client.query(miscChargeQuery, [
            apId,
            charge.type,
            charge.amount,
            charge.check_date,
            charge.voucher
          ]);
        }
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
        
        -- New financial fields
        ap.bir_percentage,
        ap.total_expenses,
        ap.total_payables,
        ar.gross_income,
        ar.collectible_amount,
        ar.net_revenue_percentage,
        
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
      LEFT JOIN accounts_receivable ar ON b.id = ar.booking_id
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