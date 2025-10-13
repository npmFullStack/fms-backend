// controllers/arController.js
import AR from '../models/AR.js';
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

  // Create AR record
  async createAR(req, res) {
    try {
      const validatedData = createARSchema.parse(req.body);
      const arRecord = await AR.createForBooking(validatedData.booking_id);
      
      res.status(201).json({
        success: true,
        message: 'AR record created successfully',
        data: arRecord
      });
    } catch (error) {
      console.error('Create AR error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to create AR record',
        error: error.message
      });
    }
  },

  // Update AR record
  async updateAR(req, res) {
    try {
      const { id } = req.params;
      const validatedData = updateARSchema.parse(req.body);
      
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

  // Delete AR record
  async deleteAR(req, res) {
    try {
      const { id } = req.params;
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

  // Create missing AR records from bookings
  async createMissingAR(req, res) {
    try {
      const createdRecords = await AR.createMissingRecords();
      
      res.json({
        success: true,
        message: `Created ${createdRecords.length} missing AR records`,
        data: createdRecords
      });
    } catch (error) {
      console.error('Create missing AR error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create missing AR records',
        error: error.message
      });
    }
  },

  // Get AR statistics
  async getARStats(req, res) {
    try {
      const stats = await AR.getStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get AR stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch AR statistics',
        error: error.message
      });
    }
  }
};