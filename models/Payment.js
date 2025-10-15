// models/Payment.js
import { pool } from "../db/index.js";

class Payment {
    // Create payment transaction
    static async createTransaction(data) {
        const { ar_id, ap_id, transaction_type, amount, payment_date } = data;
        
        const query = `
            INSERT INTO payment_transactions (ar_id, ap_id, transaction_type, amount, payment_date)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;

        const result = await pool.query(query, [
            ar_id, ap_id, transaction_type, amount, payment_date
        ]);
        return result.rows[0];
    }

    // Get all payment transactions for AR
    static async getByARId(arId) {
        const query = `
            SELECT * FROM payment_transactions 
            WHERE ar_id = $1 AND transaction_type = 'RECEIVABLE'
            ORDER BY payment_date DESC, created_at DESC;
        `;

        const result = await pool.query(query, [arId]);
        return result.rows;
    }

    // Get all payment transactions for AP
    static async getByAPId(apId) {
        const query = `
            SELECT * FROM payment_transactions 
            WHERE ap_id = $1 AND transaction_type = 'PAYABLE'
            ORDER BY payment_date DESC, created_at DESC;
        `;

        const result = await pool.query(query, [apId]);
        return result.rows;
    }

    // Get payment transaction by ID
    static async getById(transactionId) {
        const query = `
            SELECT * FROM payment_transactions WHERE id = $1;
        `;

        const result = await pool.query(query, [transactionId]);
        return result.rows[0];
    }

    // Delete payment transaction
    static async deleteTransaction(transactionId) {
        const query = `
            DELETE FROM payment_transactions WHERE id = $1 RETURNING *;
        `;

        const result = await pool.query(query, [transactionId]);
        return result.rows[0];
    }

    // Get total paid amount for AR
    static async getTotalPaidForAR(arId) {
        const query = `
            SELECT COALESCE(SUM(amount), 0) as total_paid 
            FROM payment_transactions 
            WHERE ar_id = $1 AND transaction_type = 'RECEIVABLE';
        `;

        const result = await pool.query(query, [arId]);
        return parseFloat(result.rows[0].total_paid);
    }
    
    // Add this to your Payment model
static async deleteTransactionsByARId(arId) {
    const query = `
        DELETE FROM payment_transactions 
        WHERE ar_id = $1 AND transaction_type = 'RECEIVABLE'
        RETURNING *;
    `;

    const result = await pool.query(query, [arId]);
    return result.rows;
}
}

export default Payment;