// controllers/bookingController

import {
    bookingSchema,
    bookingUpdateSchema
} from "../schemas/bookingSchema.js";
import Booking from "../models/Booking.js";
import AP from "../models/AP.js"; // Import the AP model
import { notifyMultipleRoles, getUserFullName } from "../utils/notificationService.js";

// Create a new booking
export const createBooking = async (req, res) => {
  try {
    const validated = bookingSchema.parse(req.body);

    if (validated.container_ids.length !== validated.quantity) {
      return res.status(400).json({
        message: "Number of containers must match the specified quantity",
        error: `Expected ${validated.quantity} containers, but got ${validated.container_ids.length}`,
      });
    }

    const booking = await Booking.create({
      ...validated,
      user_id: req.user?.id || null,
    });

    await AP.createForBooking(booking.id);

    const fullName = await getUserFullName(req.user?.id);

    await notifyMultipleRoles(["marketing_coordinator", "general_manager"], {
      title: "New Booking Created",
      message: `${fullName} created a new booking #${booking.booking_number} with ${validated.quantity} container(s).`,
      type: "booking",
      entity_type: "booking",
      entity_id: booking.id,
    });

    res.status(201).json({
      message: "Booking created successfully",
      booking,
    });
  } catch (err) {
    res.status(400).json({
      message: "Failed to create booking",
      error: err.message,
    });
  }
};

// Get all bookings
export const getBookings = async (_req, res) => {
    try {
        const bookings = await Booking.getAll();
        res.json({ bookings });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get booking by ID
export const getBooking = async (req, res) => {
    try {
        const booking = await Booking.getById(req.params.id);
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
                message: "Number of containers must match the specified quantity",
                error: `Expected ${validated.quantity} containers, but got ${validated.container_ids.length}`
            });
        }

        const booking = await Booking.update(req.params.id, validated);
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
        await Booking.delete(req.params.id);
        res.json({ message: "Booking deleted successfully" });
    } catch (err) {
        res.status(500).json({
            message: "Failed to delete booking",
            error: err.message
        });
    }
};

// Public search booking by booking_number or hwb_number
export const searchBookingPublic = async (req, res) => {
    try {
        const { query } = req.params;
        const booking = await Booking.findByNumberOrHwb(query);

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

// Get booking status history
export const getBookingHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const history = await Booking.getStatusHistory(id);
    res.json({ history });
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch booking history",
      error: err.message
    });
  }
};

// Add status history entry
export const addStatusHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, status_date } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    const historyEntry = await Booking.addStatusHistory(id, status, status_date);

    const fullName = await getUserFullName(req.user?.id);

    await notifyMultipleRoles(["marketing_coordinator", "general_manager"], {
      title: "Booking Status Updated",
      message: `${fullName} added a new status "${status}" to booking #${historyEntry.booking_number}.`,
      type: "booking_status",
      entity_type: "booking",
      entity_id: id,
    });

    res.status(201).json({
      message: "Status history added successfully",
      history: historyEntry,
    });
  } catch (err) {
    res.status(400).json({
      message: "Failed to add status history",
      error: err.message,
    });
  }
};

// Update status history date
export const updateStatusHistoryDate = async (req, res) => {
  try {
    const { historyId } = req.params;
    const { status_date } = req.body;

    if (!status_date) {
      return res.status(400).json({ error: "Status date is required" });
    }

    const updated = await Booking.updateStatusHistoryDate(historyId, status_date);

    if (!updated) {
      return res.status(404).json({ error: "History entry not found" });
    }

    const fullName = await getUserFullName(req.user?.id);

    await notifyMultipleRoles(["marketing_coordinator", "general_manager"], {
      title: "Booking Status Date Updated",
      message: `${fullName} updated the status date for "${updated.status}" on booking #${updated.booking_number}.`,
      type: "booking_status",
      entity_type: "booking",
      entity_id: updated.booking_id,
    });

    res.json({
      message: "Status history date updated successfully",
      history: updated,
    });
  } catch (err) {
    res.status(400).json({
      message: "Failed to update status history date",
      error: err.message,
    });
  }
};