import Courier from "../models/Courier.js";

// Search booking by number or HWB
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

    // Get status history
    const history = await Courier.getStatusHistory(booking.id);

    res.json({ 
      booking: { 
        ...booking, 
        status_history: history 
      } 
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch booking" });
  }
};

// Update booking status
export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    const booking = await Courier.updateStatus(id, status);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Get updated history
    const history = await Courier.getStatusHistory(id);

    res.json({ 
      booking: { 
        ...booking, 
        status_history: history 
      } 
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update booking status" });
  }
};