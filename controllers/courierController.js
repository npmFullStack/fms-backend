import * as Courier from "../models/Courier.js";

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

    const bookingWithCoords = {
      ...booking,
      pickup_lat: booking.pickup_lat || null,
      pickup_lng: booking.pickup_lng || null,
      delivery_lat: booking.delivery_lat || null,
      delivery_lng: booking.delivery_lng || null,
    };

    res.json({ booking: bookingWithCoords });
  } catch (err) {
    console.error("Search booking error:", err);
    res.status(500).json({ error: "Failed to fetch booking" });
  }
};

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

    res.json({ booking });
  } catch (err) {
    console.error("Update booking status error:", err);
    res.status(500).json({ error: "Failed to update booking status" });
  }
};
