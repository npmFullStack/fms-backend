// models/Payment.js
import { pool } from "../db/index.js";

class Payment {

static async createTransaction(data) {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        const { ar_id, ap_id, transaction_type, amount, payment_date } = data;
        
        const query = `
            INSERT INTO payment_transactions (ar_id, ap_id, transaction_type, amount, payment_date)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;

        const result = await client.query(query, [
            ar_id, ap_id, transaction_type, amount, payment_date
        ]);

        // ✅ ADDED: If it's a RECEIVABLE transaction, update AR collectible_amount
        if (transaction_type === 'RECEIVABLE' && ar_id) {
            // Deduct from collectible_amount
            await client.query(`
                UPDATE accounts_receivable 
                SET collectible_amount = collectible_amount - $1,
                    amount_paid = amount_paid + $1,
                    updated_at = NOW()
                WHERE id = $2
            `, [amount, ar_id]);
        }

        await client.query('COMMIT');
        return result.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

// ✅ ADD THIS METHOD: Update deleteTransaction to handle AR updates
static async deleteTransaction(transactionId) {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // First get the transaction details
        const getQuery = 'SELECT * FROM payment_transactions WHERE id = $1';
        const transaction = await client.query(getQuery, [transactionId]);
        
        if (!transaction.rows[0]) {
            throw new Error('Transaction not found');
        }

        const { ar_id, amount, transaction_type } = transaction.rows[0];

        // Delete the transaction
        const deleteQuery = 'DELETE FROM payment_transactions WHERE id = $1 RETURNING *;';
        const result = await client.query(deleteQuery, [transactionId]);

        // ✅ ADDED: If it was a RECEIVABLE transaction, add back to collectible_amount
        if (transaction_type === 'RECEIVABLE' && ar_id) {
            await client.query(`
                UPDATE accounts_receivable 
                SET collectible_amount = collectible_amount + $1,
                    amount_paid = amount_paid - $1,
                    updated_at = NOW()
                WHERE id = $2
            `, [amount, ar_id]);
        }

        await client.query('COMMIT');
        return result.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
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