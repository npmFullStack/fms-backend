// controllers/bookingController.js - Updated version
import {
    bookingSchema,
    bookingUpdateSchema
} from "../schemas/bookingSchema.js";
import * as Booking from "../models/Booking.js";

// Create a new booking
export const createBooking = async (req, res) => {
    try {
        const validated = bookingSchema.parse(req.body);

        // Validate that container_ids length matches quantity
        if (validated.container_ids.length !== validated.quantity) {
            return res.status(400).json({
                message:
                    "Number of containers must match the specified quantity",
                error: `Expected ${validated.quantity} containers, but got ${validated.container_ids.length}`
            });
        }

        // Attach logged-in user ID as creator
        const booking = await Booking.createBooking({
            ...validated,
            user_id: req.user?.id || null
        });

        res.status(201).json({
            message: "Booking created successfully",
            booking
        });
    } catch (err) {
        res.status(400).json({
            message: "Failed to create booking",
            error: err.message
        });
    }
};

// Get all bookings
export const getBookings = async (_req, res) => {
    try {
        const bookings = await Booking.getAllBookings();
        res.json({ bookings });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get booking by ID
export const getBooking = async (req, res) => {
    try {
        const booking = await Booking.getBookingById(req.params.id);
        if (!booking) {
            return res.status(404).json({ error: "Booking not found" });
        }
        res.json({ booking });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update booking
export const updateBooking = async (req, res) => {
    try {
        const validated = bookingUpdateSchema.parse(req.body);

        if (
            validated.container_ids &&
            validated.quantity &&
            validated.container_ids.length !== validated.quantity
        ) {
            return res.status(400).json({
                message:
                    "Number of containers must match the specified quantity",
                error: `Expected ${validated.quantity} containers, but got ${validated.container_ids.length}`
            });
        }

        const booking = await Booking.updateBooking(req.params.id, validated);
        if (!booking) {
            return res.status(404).json({ error: "Booking not found" });
        }
        res.json({
            message: "Booking updated successfully",
            booking
        });
    } catch (err) {
        res.status(400).json({
            message: "Failed to update booking",
            error: err.message
        });
    }
};

// Delete booking
export const deleteBooking = async (req, res) => {
    try {
        await Booking.deleteBooking(req.params.id);
        res.json({ message: "Booking deleted successfully" });
    } catch (err) {
        res.status(500).json({
            message: "Failed to delete booking",
            error: err.message
        });
    }
};



// Public search booking by booking_number or hwb_number (no auth required)
export const searchBookingPublic = async (req, res) => {
    try {
        const { query } = req.params;
        const booking = await Booking.findByNumberOrHwb(query); // we'll add this in the model

        if (!booking) {
            return res.status(404).json({ error: "Booking not found" });
        }

        res.json({ booking });
    } catch (err) {
        res.status(500).json({
            message: "Failed to fetch booking",
            error: err.message
        });
    }
};
