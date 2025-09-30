// controllers/courierController.js

import * as Courier from "../models/Courier.js";

// Search booking (public) with history
export const searchBookingPublic = async (req, res) => {
    try {
        const { query } = req.params;

        if (!query || query.trim() === "") {
            return res.status(400).json({ error: "Search query is required" });
        }

        const booking = await Courier.findByNumberOrHwb(query.trim());
        if (!booking) {
            return res.status(404).json({ error: "Booking not found" });
        }

        // Get history from model
        const history = await Courier.getStatusHistory(booking.id);

        res.json({ booking: { ...booking, status_history: history } });
    } catch (err) {
        console.error("Search booking error:", err);
        res.status(500).json({ error: "Failed to fetch booking" });
    }
};

// Update booking status (auto-logs history)
export const updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ error: "Status is required" });
        }

        const booking = await Courier.updateStatusById(id, status);
        if (!booking) {
            return res.status(404).json({ error: "Booking not found" });
        }

        // Get updated history
        const history = await Courier.getStatusHistory(id);

        res.json({ booking: { ...booking, status_history: history } });
    } catch (err) {
        console.error("Update booking status error:", err);
        res.status(500).json({ error: "Failed to update booking status" });
    }
};
