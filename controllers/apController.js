// controllers/apController.js

import AP from "../models/AP.js";
import {
    updateAPFormSchema
} from "../schemas/apSchema.js";
import { notifyMultipleRoles, getUserFullName } from "../utils/notificationService.js";

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

// Update AP record - UPDATED to use HWB/Booking numbers
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
        
        // Send notification to admin_finance and gm - UPDATED
        const fullName = await getUserFullName(req.user?.id);
        
        // Use HWB number if available, otherwise use booking number
        const referenceNumber = existingRecord.hwb_number || existingRecord.booking_number;
        const referenceType = existingRecord.hwb_number ? 'HWB' : 'Booking';
        
        await notifyMultipleRoles(["admin_finance", "general_manager"], {
            title: "AP Record Updated",
            message: `${fullName} updated AP record for ${referenceType} No. #${referenceNumber}.`,
            type: "ap",
            entity_type: "ap",
            entity_id: updatedRecord.id || id,
        });

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

// NEW: Get AP by booking number or HWB number
export const getAPByBookingNumber = async (req, res) => {
    try {
        const { bookingNumber } = req.params;
        
        // You'll need to add this method to your AP model
        const apRecord = await AP.getByBookingNumber(bookingNumber);

        if (!apRecord) {
            return res.status(404).json({
                message: "AP record not found for this booking/HWB number"
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