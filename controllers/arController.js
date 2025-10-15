// controllers/arController.js
import AR from '../models/AR.js';
import Payment from '../models/Payment.js';
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

  // ✅ UPDATED: Update AR record with payment transaction
  async updateAR(req, res) {
    try {
      const { id } = req.params;
      const validatedData = updateARSchema.parse(req.body);
      
      // ✅ Check if payment data is provided
      if (validatedData.amount_paid && validatedData.payment_date) {
        const updatedRecord = await AR.update(id, validatedData);
        
        if (!updatedRecord) {
          return res.status(404).json({
            success: false,
            message: 'AR record not found'
          });
        }
        
        res.json({
          success: true,
          message: 'Payment recorded successfully',
          data: updatedRecord
        });
      } else {
        // ✅ Handle updates without payment (like terms update)
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          
          const updateQuery = `
            UPDATE accounts_receivable 
            SET terms = COALESCE($1, terms),
                updated_at = NOW()
            WHERE id = $2
            RETURNING *;
          `;
          
          const result = await client.query(updateQuery, [
            validatedData.terms,
            id
          ]);
          
          await client.query('COMMIT');
          
          if (result.rows.length === 0) {
            return res.status(404).json({
              success: false,
              message: 'AR record not found'
            });
          }
          
          const updatedRecord = await AR.getById(id);
          
          res.json({
            success: true,
            message: 'AR record updated successfully',
            data: updatedRecord
          });
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      }
    } catch (error) {
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
    }
  },

  // ✅ NEW: Get payment transactions for AR record
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

  // ✅ NEW: Create standalone payment transaction
  async createPaymentTransaction(req, res) {
    try {
      const { id } = req.params; // AR ID
      const { amount, payment_date } = req.body;
      
      // Validate required fields
      if (!amount || !payment_date) {
        return res.status(400).json({
          success: false,
          message: 'Amount and payment date are required'
        });
      }
      
      // Verify AR record exists
      const arRecord = await AR.getById(id);
      if (!arRecord) {
        return res.status(404).json({
          success: false,
          message: 'AR record not found'
        });
      }
      
      // Create payment transaction
      const transaction = await Payment.createTransaction({
        ar_id: id,
        transaction_type: 'RECEIVABLE',
        amount: parseFloat(amount),
        payment_date
      });
      
      // Update AR collectible_amount
      const totalPaid = await Payment.getTotalPaidForAR(id);
      const newCollectibleAmount = arRecord.gross_income - totalPaid;
      
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        await client.query(`
          UPDATE accounts_receivable 
          SET collectible_amount = $1,
              updated_at = NOW()
          WHERE id = $2
        `, [newCollectibleAmount, id]);
        
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
      
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
      
      // First delete related payment transactions
      await Payment.deleteTransactionsByARId(id);
      
      // Then delete AR record
      const query = 'DELETE FROM accounts_receivable WHERE id = $1';
      await pool.query(query, [id]);
      
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

  // ✅ NEW: Get AR by booking number or HWB
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
  }
};