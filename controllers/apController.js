// controllers/apController.js
import AP from "../models/AP.js";
import { 
    updateAPFormSchema 
} from "../schemas/apSchema.js";

// Get all AP summaries
export const getAPSummaries = async (req, res) => {
    try {
        const apSummaries = await AP.getAllSummaries();
        res.json({ 
            message: "AP summaries fetched successfully",
            apSummaries 
        });
    } catch (err) {
        res.status(500).json({
            message: "Failed to fetch AP summaries",
            error: err.message
        });
    }
};

// Get AP by ID
export const getAPById = async (req, res) => {
    try {
        const { id } = req.params;
        const apRecord = await AP.getById(id);
        
        if (!apRecord) {
            return res.status(404).json({ 
                message: "AP record not found" 
            });
        }

        res.json({
            message: "AP record fetched successfully",
            apRecord
        });
    } catch (err) {
        res.status(500).json({
            message: "Failed to fetch AP record",
            error: err.message
        });
    }
};

// Update AP record
export const updateAP = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validate request body
        const validatedData = updateAPFormSchema.parse(req.body);

        // Check if AP record exists
        const existingRecord = await AP.getById(id);
        if (!existingRecord) {
            return res.status(404).json({
                message: "AP record not found"
            });
        }

        // Update AP record
        const updatedRecord = await AP.update(id, validatedData);

        res.json({
            message: "AP record updated successfully",
            apRecord: updatedRecord
        });
    } catch (err) {
        if (err.name === 'ZodError') {
            return res.status(400).json({
                message: "Validation failed",
                errors: err.errors
            });
        }
        
        res.status(500).json({
            message: "Failed to update AP record",
            error: err.message
        });
    }
};

// Create missing AP records for existing bookings
export const createMissingAPRecords = async (req, res) => {
    try {
        const createdRecords = await AP.createMissingRecords();
        
        res.json({
            message: `Created ${createdRecords.length} missing AP records`,
            createdRecords
        });
    } catch (err) {
        res.status(500).json({
            message: "Failed to create missing AP records",
            error: err.message
        });
    }
};

// Get AP by booking ID
export const getAPByBookingId = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const apRecord = await AP.getByBookingId(bookingId);
        
        if (!apRecord) {
            return res.status(404).json({
                message: "AP record not found for this booking"
            });
        }

        res.json({
            message: "AP record fetched successfully",
            apRecord
        });
    } catch (err) {
        res.status(500).json({
            message: "Failed to fetch AP record",
            error: err.message
        });
    }
};