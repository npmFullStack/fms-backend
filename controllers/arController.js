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

  // ✅ UPDATED: Update AR record - now handles payments through transactions
  async updateAR(req, res) {
    try {
      const { id } = req.params;
      const validatedData = updateARSchema.parse(req.body);
      
      // ✅ If payment data is provided, create a payment transaction
      if (validatedData.amount_paid && validatedData.payment_date) {
        // First, get the current AR record to know the gross_income
        const currentAR = await AR.getById(id);
        if (!currentAR) {
          return res.status(404).json({
            success: false,
            message: 'AR record not found'
          });
        }

        // Create payment transaction (this will automatically update collectible_amount)
        const transaction = await Payment.createTransaction({
          ar_id: id,
          transaction_type: 'RECEIVABLE',
          amount: parseFloat(validatedData.amount_paid),
          payment_date: validatedData.payment_date
        });

        // Get the updated AR record with new collectible_amount
        const updatedRecord = await AR.getById(id);
        
        res.json({
          success: true,
          message: 'Payment recorded successfully',
          data: {
            transaction,
            ar_record: updatedRecord
          }
        });
      } else {
        // ✅ Handle non-payment updates (terms, etc.)
        const updatedRecord = await AR.update(id, validatedData);
        
        if (!updatedRecord) {
          return res.status(404).json({
            success: false,
            message: 'AR record not found'
          });
        }
        
        res.json({
          success: true,
          message: 'AR record updated successfully',
          data: updatedRecord
        });
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

  // ✅ UPDATED: Get payment transactions for AR record
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

  // ✅ UPDATED: Create standalone payment transaction (simplified)
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
      
      // ✅ Create payment transaction (this automatically updates collectible_amount)
      const transaction = await Payment.createTransaction({
        ar_id: id,
        transaction_type: 'RECEIVABLE',
        amount: parseFloat(amount),
        payment_date
      });
      
      // Get updated AR record
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

  // ✅ UPDATED: Delete AR record
  async deleteAR(req, res) {
    try {
      const { id } = req.params;
      
      // First delete related payment transactions (this handles collectible_amount reset)
      await Payment.deleteTransactionsByARId(id);
      
      // Then delete AR record using AR model
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

  // ✅ NEW: Delete a specific payment transaction
  async deletePaymentTransaction(req, res) {
    try {
      const { id, transactionId } = req.params;
      
      // Verify AR record exists
      const arRecord = await AR.getById(id);
      if (!arRecord) {
        return res.status(404).json({
          success: false,
          message: 'AR record not found'
        });
      }
      
      // Delete the transaction (this automatically updates collectible_amount)
      const deletedTransaction = await Payment.deleteTransaction(transactionId);
      
      // Get updated AR record
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