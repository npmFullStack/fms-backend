// models/AR.js
import { pool } from "../db/index.js";

class AR {

    // Get AR by booking ID
    static async getByBookingId(bookingId) {
        const query = `
            SELECT * FROM accounts_receivable
            WHERE booking_id = $1;
        `;

        const result = await pool.query(query, [bookingId]);
        return result.rows[0];
    }

    // Get all AR summaries with booking data
    static async getAllSummaries() {
        const query = `
            SELECT
                ar.id as ar_id,
                ar.booking_id,
                ar.amount_paid,
                ar.payment_date,
                ar.terms,
                ar.aging,
                ar.gross_income,
                ar.net_revenue_percentage,
                ar.created_at,
                ar.updated_at,

                b.booking_number,
                b.hwb_number,
                b.origin_port,
                b.destination_port,
                b.commodity,
                b.quantity,
                b.booking_mode,
                b.status as booking_status,
                b.payment_status,
                b.created_at as booking_date,

                -- Shipper info
                bs.company_name as shipper,

                -- For AR, we need the invoice amount (amount due)
                -- Since we don't have invoice_amount column, we'll use amount_paid as reference
                -- You might want to add an 'invoice_amount' column to accounts_receivable table later
                COALESCE(ar.amount_paid, 0) as paid_amount,

                -- Calculate aging if payment_date exists, otherwise use current date
                CASE
                    WHEN ar.payment_date IS NOT NULL THEN
                        EXTRACT(DAY FROM (ar.payment_date::timestamp - b.created_at))
                    ELSE
                        EXTRACT(DAY FROM (NOW() - b.created_at))
                END as current_aging,

                -- For AR balance, we calculate what's still owed
                -- Since we don't have invoice_amount, we'll assume the goal is to collect payments
                -- You might want to add invoice_amount column to track the original amount due
                (COALESCE(ar.amount_paid, 0)) as current_balance,

                -- Payment status based on amount paid
                -- This needs invoice_amount to be accurate - for now using simple logic
                CASE
                    WHEN ar.amount_paid > 0 THEN 'PARTIAL'
                    ELSE 'UNPAID'
                END as ar_payment_status,

                -- Terms status indicator
                CASE
                    WHEN ar.terms > 0 AND EXTRACT(DAY FROM (NOW() - b.created_at)) > ar.terms THEN 'OVERDUE'
                    WHEN ar.terms > 0 THEN 'WITHIN_TERMS'
                    ELSE 'NO_TERMS'
                END as terms_status,

                -- ✅ NEW: Calculate net revenue amount
                (ar.gross_income * (ar.net_revenue_percentage / 100)) as net_revenue_amount,

                -- ✅ NEW: Calculate outstanding balance using gross_income
                (COALESCE(ar.gross_income, 0) - COALESCE(ar.amount_paid, 0)) as outstanding_balance

            FROM accounts_receivable ar
            INNER JOIN bookings b ON ar.booking_id = b.id
            LEFT JOIN booking_shipper_details bs ON b.id = bs.booking_id
            ORDER BY b.created_at DESC;
        `;

        const result = await pool.query(query);
        return result.rows;
    }

    // Get AR by ID with full details
    static async getById(arId) {
        const query = `
            SELECT
                ar.*,
                b.*,
                bs.company_name as shipper,

                -- Calculate aging
                CASE
                    WHEN ar.payment_date IS NOT NULL THEN
                        EXTRACT(DAY FROM (ar.payment_date::timestamp - b.created_at))
                    ELSE
                        EXTRACT(DAY FROM (NOW() - b.created_at))
                END as current_aging,

                -- Current paid amount
                COALESCE(ar.amount_paid, 0) as paid_amount,

                -- Route information
                CONCAT(b.origin_port, ' → ', b.destination_port) as route,

                -- Terms status
                CASE
                    WHEN ar.terms > 0 AND EXTRACT(DAY FROM (NOW() - b.created_at)) > ar.terms THEN 'OVERDUE'
                    WHEN ar.terms > 0 THEN 'WITHIN_TERMS'
                    ELSE 'NO_TERMS'
                END as terms_status,

                -- ✅ NEW: Calculate net revenue amount
                (ar.gross_income * (ar.net_revenue_percentage / 100)) as net_revenue_amount,

                -- ✅ NEW: Calculate outstanding balance using gross_income
                (COALESCE(ar.gross_income, 0) - COALESCE(ar.amount_paid, 0)) as outstanding_balance

            FROM accounts_receivable ar
            INNER JOIN bookings b ON ar.booking_id = b.id
            LEFT JOIN booking_shipper_details bs ON b.id = bs.booking_id
            WHERE ar.id = $1;
        `;

        const result = await pool.query(query, [arId]);
        return result.rows[0];
    }

    // Update AR record
    static async update(arId, data) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            let aging = null;

            // Calculate aging if payment_date is provided
            if (data.payment_date) {
                const bookingQuery = `
                    SELECT created_at FROM bookings
                    WHERE id = (SELECT booking_id FROM accounts_receivable WHERE id = $1)
                `;
                const bookingResult = await client.query(bookingQuery, [arId]);

                if (bookingResult.rows[0]) {
                    const bookingDate = new Date(bookingResult.rows[0].created_at);
                    const paymentDate = new Date(data.payment_date);
                    const diffTime = paymentDate - bookingDate;
                    aging = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                }
            }

            // ✅ UPDATED: Include new financial fields
            const updateQuery = `
                UPDATE accounts_receivable
                SET amount_paid = $1,
                    payment_date = $2,
                    terms = $3,
                    aging = $4,
                    gross_income = $5,
                    net_revenue_percentage = $6,
                    updated_at = NOW()
                WHERE id = $7
                RETURNING *;
            `;

            const result = await client.query(updateQuery, [
                data.amount_paid || 0,
                data.payment_date || null,
                data.terms || 0,
                aging,
                data.gross_income || 0,        // ✅ NEW
                data.net_revenue_percentage || 0, // ✅ NEW
                arId
            ]);

            await client.query('COMMIT');

            // Return updated record with joined data
            return await this.getById(arId);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // Get AR by booking number or HWB number
    static async getByBookingNumber(bookingNumber) {
        const query = `
            SELECT
                ar.*,
                b.*,
                bs.company_name as shipper,

                -- ✅ NEW: Calculate net revenue amount
                (ar.gross_income * (ar.net_revenue_percentage / 100)) as net_revenue_amount,

                -- ✅ NEW: Calculate outstanding balance using gross_income
                (COALESCE(ar.gross_income, 0) - COALESCE(ar.amount_paid, 0)) as outstanding_balance

            FROM accounts_receivable ar
            INNER JOIN bookings b ON ar.booking_id = b.id
            LEFT JOIN booking_shipper_details bs ON b.id = bs.booking_id
            WHERE b.booking_number = $1 OR b.hwb_number = $1;
        `;

        const result = await pool.query(query, [bookingNumber]);
        return result.rows[0];
    }

    // ✅ NEW: Update AR financial fields only (for AP integration)
    static async updateFinancialFields(arId, data) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const updateQuery = `
                UPDATE accounts_receivable
                SET gross_income = $1,
                    net_revenue_percentage = $2,
                    updated_at = NOW()
                WHERE id = $3
                RETURNING *;
            `;

            const result = await client.query(updateQuery, [
                data.gross_income || 0,
                data.net_revenue_percentage || 0,
                arId
            ]);

            await client.query('COMMIT');

            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // ✅ NEW: Get AR by booking ID for AP integration
    static async getByBookingIdForAP(bookingId) {
        const query = `
            SELECT 
                ar.id,
                ar.booking_id,
                ar.gross_income,
                ar.net_revenue_percentage,
                ar.amount_paid
            FROM accounts_receivable ar
            WHERE ar.booking_id = $1;
        `;

        const result = await pool.query(query, [bookingId]);
        return result.rows[0];
    }

}

export default AR;