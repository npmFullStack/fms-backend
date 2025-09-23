// controllers/courierController.js
import * as Courier from "../models/Courier.js";

export const searchBookingPublic = async (req, res) => {
  try {
    const { query } = req.params;
    
    // Validate input
    if (!query || query.trim() === '') {
      return res.status(400).json({ error: "Search query is required" });
    }

    const booking = await Courier.findByNumberOrHwb(query.trim());
    
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Add coordinate fields if they don't exist (for backward compatibility)
    const bookingWithCoords = {
      ...booking,
      pickup_lat: booking.pickup_lat || null,
      pickup_lng: booking.pickup_lng || null,
      delivery_lat: booking.delivery_lat || null,
      delivery_lng: booking.delivery_lng || null,
    };

    res.json({ booking: bookingWithCoords });
  } catch (err) {
    console.error('Search booking error:', err);
    res.status(500).json({
      message: "Failed to fetch booking",
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

