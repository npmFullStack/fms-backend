// controllers/arController.js
import AR from '../models/AR.js';
import Payment from '../models/Payment.js';
import { pool } from '../db/index.js';
import { createARSchema, updateARSchema } from '../schemas/arSchema.js';

export const arController = {
  // Get all AR records
  async getAllAR(req, res) {
    try {
      const arRecords = await AR.getAllSummaries();
      res.json({
        success: true,
        data: arRecords,
        count: arRecords.length
      });
    } catch (error) {
      console.error('Get AR error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch AR records',
        error: error.message
      });
    }
  },

  // Get AR by ID
  async getARById(req, res) {
    try {
      const { id } = req.params;
      const arRecord = await AR.getById(id);

      if (!arRecord) {
        return res.status(404).json({
          success: false,
          message: 'AR record not found'
        });
      }

      res.json({
        success: true,
        data: arRecord
      });
    } catch (error) {
      console.error('Get AR by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch AR record',
        error: error.message
      });
    }
  },

  // ✅ FIXED: Update AR record - now handles payments AND terms correctly
  async updateAR(req, res) {
    const client = await pool.connect();
    
    try {
      const { id } = req.params;
      const validatedData = updateARSchema.parse(req.body);

      console.log('Update AR Request:', { id, data: validatedData });

      await client.query('BEGIN');

      // ✅ Get current AR record
      const currentAR = await AR.getById(id);
      if (!currentAR) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'AR record not found'
        });
      }

      let paymentTransaction = null;

      // ✅ STEP 1: Handle payment if provided
      if (validatedData.amount_paid && validatedData.amount_paid > 0 && validatedData.payment_date) {
        console.log('Creating payment transaction:', {
          ar_id: id,
          amount: validatedData.amount_paid,
          payment_date: validatedData.payment_date
        });

        // Create payment transaction
        const transactionQuery = `
          INSERT INTO payment_transactions (ar_id, transaction_type, amount, payment_date, created_at)
          VALUES ($1, $2, $3, $4, NOW())
          RETURNING *;
        `;

        const transactionResult = await client.query(transactionQuery, [
          id,
          'RECEIVABLE',
          parseFloat(validatedData.amount_paid),
          validatedData.payment_date
        ]);

        paymentTransaction = transactionResult.rows[0];
        console.log('Payment transaction created:', paymentTransaction);

        // ✅ Update amount_paid (sum of all transactions)
        const updateAmountPaidQuery = `
          UPDATE accounts_receivable
          SET amount_paid = (
            SELECT COALESCE(SUM(amount), 0)
            FROM payment_transactions
            WHERE ar_id = $1 AND transaction_type = 'RECEIVABLE'
          ),
          updated_at = NOW()
          WHERE id = $1;
        `;
        await client.query(updateAmountPaidQuery, [id]);
        console.log('amount_paid updated from transactions');

        // ✅ Update collectible_amount
        const currentCollectible = parseFloat(currentAR.collectible_amount || currentAR.gross_income || 0);
        const newCollectible = currentCollectible - parseFloat(validatedData.amount_paid);

        const updateCollectibleQuery = `
          UPDATE accounts_receivable
          SET collectible_amount = $1,
              updated_at = NOW()
          WHERE id = $2;
        `;
        await client.query(updateCollectibleQuery, [newCollectible, id]);
        console.log('collectible_amount updated:', { old: currentCollectible, new: newCollectible });
      }

      // ✅ STEP 2: Handle terms and payment_date updates
      if (validatedData.terms !== undefined || validatedData.payment_date) {
        let aging = null;

        // Calculate aging if payment_date is provided
        if (validatedData.payment_date) {
          const bookingQuery = `
            SELECT created_at FROM bookings
            WHERE id = (SELECT booking_id FROM accounts_receivable WHERE id = $1)
          `;
          const bookingResult = await client.query(bookingQuery, [id]);
          
          if (bookingResult.rows[0]) {
            const bookingDate = new Date(bookingResult.rows[0].created_at);
            const paymentDate = new Date(validatedData.payment_date);
            const diffTime = paymentDate - bookingDate;
            aging = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          }
        }

        // ✅ Update terms and payment_date
        const updateTermsQuery = `
          UPDATE accounts_receivable
          SET terms = COALESCE($1, terms),
              payment_date = COALESCE($2, payment_date),
              aging = COALESCE($3, aging),
              updated_at = NOW()
          WHERE id = $4;
        `;

        await client.query(updateTermsQuery, [
          validatedData.terms !== undefined ? validatedData.terms : null,
          validatedData.payment_date || null,
          aging,
          id
        ]);
        console.log('Terms and payment_date updated:', { terms: validatedData.terms, payment_date: validatedData.payment_date });
      }

      await client.query('COMMIT');

      // Get updated AR record with all joins
      const updatedRecord = await AR.getById(id);

      console.log('Final updated record:', {
        ar_id: updatedRecord.id,
        amount_paid: updatedRecord.amount_paid,
        collectible_amount: updatedRecord.collectible_amount,
        terms: updatedRecord.terms
      });

      res.json({
        success: true,
        message: paymentTransaction ? 'Payment recorded and terms updated successfully' : 'AR record updated successfully',
        data: {
          transaction: paymentTransaction,
          ar_record: updatedRecord
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Update AR error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update AR record',
        error: error.message
      });
    } finally {
      client.release();
    }
  },

  // Get payment transactions for AR record
  async getPaymentTransactions(req, res) {
    try {
      const { id } = req.params;

      // Verify AR record exists
      const arRecord = await AR.getById(id);
      if (!arRecord) {
        return res.status(404).json({
          success: false,
          message: 'AR record not found'
        });
      }

      const transactions = await Payment.getByARId(id);

      res.json({
        success: true,
        data: transactions,
        count: transactions.length
      });
    } catch (error) {
      console.error('Get payment transactions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment transactions',
        error: error.message
      });
    }
  },

  // Create standalone payment transaction
  async createPaymentTransaction(req, res) {
    try {
      const { id } = req.params;
      const { amount, payment_date } = req.body;

      if (!amount || !payment_date) {
        return res.status(400).json({
          success: false,
          message: 'Amount and payment date are required'
        });
      }

      const arRecord = await AR.getById(id);
      if (!arRecord) {
        return res.status(404).json({
          success: false,
          message: 'AR record not found'
        });
      }

      const transaction = await Payment.createTransaction({
        ar_id: id,
        transaction_type: 'RECEIVABLE',
        amount: parseFloat(amount),
        payment_date
      });

      const updatedAR = await AR.getById(id);

      res.json({
        success: true,
        message: 'Payment transaction created successfully',
        data: {
          transaction,
          ar_record: updatedAR
        }
      });
    } catch (error) {
      console.error('Create payment transaction error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create payment transaction',
        error: error.message
      });
    }
  },

  // Delete AR record
  async deleteAR(req, res) {
    try {
      const { id } = req.params;

      await Payment.deleteTransactionsByARId(id);

      const deleteQuery = 'DELETE FROM accounts_receivable WHERE id = $1';
      const result = await pool.query(deleteQuery, [id]);

      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'AR record not found'
        });
      }

      res.json({
        success: true,
        message: 'AR record deleted successfully'
      });
    } catch (error) {
      console.error('Delete AR error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete AR record',
        error: error.message
      });
    }
  },

  // Get AR by booking number or HWB
  async getARByBookingNumber(req, res) {
    try {
      const { number } = req.params;
      const arRecord = await AR.getByBookingNumber(number);

      if (!arRecord) {
        return res.status(404).json({
          success: false,
          message: 'AR record not found'
        });
      }

      res.json({
        success: true,
        data: arRecord
      });
    } catch (error) {
      console.error('Get AR by booking number error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch AR record',
        error: error.message
      });
    }
  },

  // Delete a specific payment transaction
  async deletePaymentTransaction(req, res) {
    try {
      const { id, transactionId } = req.params;

      const arRecord = await AR.getById(id);
      if (!arRecord) {
        return res.status(404).json({
          success: false,
          message: 'AR record not found'
        });
      }

      const deletedTransaction = await Payment.deleteTransaction(transactionId);
      const updatedAR = await AR.getById(id);

      res.json({
        success: true,
        message: 'Payment transaction deleted successfully',
        data: {
          deleted_transaction: deletedTransaction,
          ar_record: updatedAR
        }
      });
    } catch (error) {
      console.error('Delete payment transaction error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete payment transaction',
        error: error.message
      });
    }
  }
};