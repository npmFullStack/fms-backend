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
                ar.collectible_amount,
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

                COALESCE(ar.amount_paid, 0) as paid_amount,

                -- Calculate aging if payment_date exists, otherwise use current date
                CASE
                    WHEN ar.payment_date IS NOT NULL THEN
                        EXTRACT(DAY FROM (ar.payment_date::timestamp - b.created_at))
                    ELSE
                        EXTRACT(DAY FROM (NOW() - b.created_at))
                END as current_aging,

                -- ✅ UPDATED: Calculate outstanding balance using collectible_amount
                (COALESCE(ar.collectible_amount, ar.gross_income) - COALESCE(ar.amount_paid, 0)) as outstanding_balance,

                -- Payment status based on amount paid
                CASE
                    WHEN ar.amount_paid >= COALESCE(ar.collectible_amount, ar.gross_income) THEN 'PAID'
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
                (ar.gross_income * (ar.net_revenue_percentage / 100)) as net_revenue_amount

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

                -- ✅ UPDATED: Calculate outstanding balance using collectible_amount
                (COALESCE(ar.collectible_amount, ar.gross_income) - COALESCE(ar.amount_paid, 0)) as outstanding_balance

            FROM accounts_receivable ar
            INNER JOIN bookings b ON ar.booking_id = b.id
            LEFT JOIN booking_shipper_details bs ON b.id = bs.booking_id
            WHERE ar.id = $1;
        `;

        const result = await pool.query(query, [arId]);
        return result.rows[0];
    }

   // models/AR.js - Update the update method
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

        // ✅ UPDATED: Only update non-payment fields
        // Payment handling is done through transactions in the controller
        const updateQuery = `
            UPDATE accounts_receivable
            SET payment_date = $1,
                terms = $2,
                aging = $3,
                updated_at = NOW()
            WHERE id = $4
            RETURNING *;
        `;

        const result = await client.query(updateQuery, [
            data.payment_date || null,
            data.terms || 0,
            aging,
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

// ✅ ADD THIS METHOD: Update collectible_amount when payment transaction is created
static async deductFromCollectibleAmount(arId, paymentAmount) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Get current collectible_amount
        const currentQuery = `
            SELECT collectible_amount FROM accounts_receivable WHERE id = $1
        `;
        const currentResult = await client.query(currentQuery, [arId]);
        const currentCollectibleAmount = parseFloat(currentResult.rows[0]?.collectible_amount || 0);
        
        // Calculate new collectible_amount
        const newCollectibleAmount = currentCollectibleAmount - paymentAmount;

        // Update collectible_amount
        const updateQuery = `
            UPDATE accounts_receivable
            SET collectible_amount = $1,
                updated_at = NOW()
            WHERE id = $2
            RETURNING *;
        `;

        const result = await client.query(updateQuery, [newCollectibleAmount, arId]);

        await client.query('COMMIT');
        return result.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

// ✅ ADD THIS METHOD: Update amount_paid based on total transactions
static async updateAmountPaidFromTransactions(arId) {
    const query = `
        UPDATE accounts_receivable
        SET amount_paid = (
            SELECT COALESCE(SUM(amount), 0) 
            FROM payment_transactions 
            WHERE ar_id = $1 AND transaction_type = 'RECEIVABLE'
        ),
        updated_at = NOW()
        WHERE id = $1
        RETURNING *;
    `;

    const result = await pool.query(query, [arId]);
    return result.rows[0];
}

    // ✅ UPDATED: Get AR by booking number with collectible_amount
    static async getByBookingNumber(bookingNumber) {
        const query = `
            SELECT
                ar.*,
                b.*,
                bs.company_name as shipper,

                -- ✅ NEW: Calculate net revenue amount
                (ar.gross_income * (ar.net_revenue_percentage / 100)) as net_revenue_amount,

                -- ✅ UPDATED: Calculate outstanding balance using collectible_amount
                (COALESCE(ar.collectible_amount, ar.gross_income) - COALESCE(ar.amount_paid, 0)) as outstanding_balance

            FROM accounts_receivable ar
            INNER JOIN bookings b ON ar.booking_id = b.id
            LEFT JOIN booking_shipper_details bs ON b.id = bs.booking_id
            WHERE b.booking_number = $1 OR b.hwb_number = $1;
        `;

        const result = await pool.query(query, [bookingNumber]);
        return result.rows[0];
    }

    // ✅ UPDATED: Update AR financial fields with collectible_amount
    static async updateFinancialFields(arId, data) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const updateQuery = `
                UPDATE accounts_receivable
                SET gross_income = $1,
                    collectible_amount = $2,  // ✅ ADDED
                    net_revenue_percentage = $3,
                    updated_at = NOW()
                WHERE id = $4
                RETURNING *;
            `;

            const result = await client.query(updateQuery, [
                data.gross_income || 0,
                data.collectible_amount || data.gross_income || 0,  // ✅ Set collectible_amount same as gross_income initially
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

    // ✅ UPDATED: Get AR by booking ID with collectible_amount
    static async getByBookingIdForAP(bookingId) {
        const query = `
            SELECT 
                ar.id,
                ar.booking_id,
                ar.gross_income,
                ar.collectible_amount,
                ar.net_revenue_percentage,
                ar.amount_paid
            FROM accounts_receivable ar
            WHERE ar.booking_id = $1;
        `;

        const result = await pool.query(query, [bookingId]);
        return result.rows[0];
    }

    // ✅ NEW: Update collectible_amount only
    static async updateCollectibleAmount(arId, collectibleAmount) {
        const query = `
            UPDATE accounts_receivable
            SET collectible_amount = $1,
                updated_at = NOW()
            WHERE id = $2
            RETURNING *;
        `;

        const result = await pool.query(query, [collectibleAmount, arId]);
        return result.rows[0];
    }
}

export default AR;