import Courier from "../models/Courier.js";
import { v4 as uuidv4 } from "uuid";
// controllers/courierController.js
import { uploadToCloudinary } from "../utils/imageUtils.js";
import { notifyMultipleRoles, getUserFullName } from "../utils/notificationService.js";

export const addIncidentReport = async (req, res) => {
  try {
    const { description, bookingId, totalCost } = req.body;
    let imageUrl = null;

    if (req.file) {
      const upload = await uploadToCloudinary(req.file.buffer);
      imageUrl = upload.secure_url;
    }

    const incident = await Courier.addIncident({
      imageUrl,
      description,
      bookingId,
      totalCost: totalCost || 0,
    });

    const fullName = await getUserFullName(req.user?.id);
    await notifyMultipleRoles(["general_manager", "marketing_coordinator"], {
      title: "New Incident Reported",
      message: `${fullName || "A user"} reported a land incident.`,
      type: "incident",
      entity_type: "incident",
      entity_id: incident.id,
    });

    res.status(201).json({ message: "Incident created successfully", incident });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


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