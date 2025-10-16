import { v4 as uuidv4 } from "uuid";
import Incident from "../models/Incident.js";
import { incidentSchema } from "../schemas/incidentSchema.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/imageUtils.js";
import { notifyMultipleRoles, getUserFullName } from "../utils/notificationService.js";

// Get all incidents
export const getIncidents = async (req, res) => {
  try {
    const incidents = await Incident.getAll();
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get single incident
export const getIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const incident = await Incident.findById(id);

    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    res.json(incident);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get incidents by booking
export const getIncidentsByBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const incidents = await Incident.findByBookingId(bookingId);
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Create new incident
export const addIncident = async (req, res) => {
  try {
    const id = uuidv4();
    const { type, description, totalCost, bookingId } = req.body;

    // Validate input
    const validatedData = incidentSchema.parse({
      type,
      description,
      totalCost: parseFloat(totalCost),
      bookingId
    });

    let imageUrl = null;

    // Handle image upload if provided
    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer);
        imageUrl = result.secure_url;
      } catch (error) {
        // Fail silently for image upload
      }
    }

    const incident = await Incident.create(
      id,
      imageUrl,
      validatedData.type,
      validatedData.description,
      validatedData.totalCost,
      validatedData.bookingId
    );

    // Send notification
    const fullName = await getUserFullName(req.user?.id);
    await notifyMultipleRoles(['general_manager', 'marketing_coordinator'], {
      title: "New Incident Reported",
      message: `${fullName} reported a new ${validatedData.type.toLowerCase()} incident.`,
      type: "incident",
      entity_type: "incident",
      entity_id: incident.id,
    });

    res.status(201).json({
      message: "Incident created successfully",
      incident,
    });
  } catch (error) {
    if (error.errors) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// Update incident
export const editIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, description, totalCost, bookingId } = req.body;

    const currentIncident = await Incident.findById(id);
    if (!currentIncident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    // Validate input
    const validatedData = incidentSchema.parse({
      type,
      description,
      totalCost: parseFloat(totalCost),
      bookingId
    });

    let imageUrl = currentIncident.image_url;

    // Handle image upload if new file provided
    if (req.file) {
      try {
        // Delete old image if exists
        if (currentIncident.image_url) {
          await deleteFromCloudinary(currentIncident.image_url);
        }
        // Upload new image
        const result = await uploadToCloudinary(req.file.buffer);
        imageUrl = result.secure_url;
      } catch (error) {
        // Fail silently for image upload
      }
    }

    const updatedIncident = await Incident.update(
      id,
      imageUrl,
      validatedData.type,
      validatedData.description,
      validatedData.totalCost,
      validatedData.bookingId
    );

    // Send notification
    const fullName = await getUserFullName(req.user?.id);
    await notifyMultipleRoles(['general_manager', 'marketing_coordinator'], {
      title: "Incident Updated",
      message: `${fullName} updated a ${validatedData.type.toLowerCase()} incident.`,
      type: "incident",
      entity_type: "incident",
      entity_id: id,
    });

    res.json({
      message: "Incident updated successfully",
      incident: updatedIncident,
    });
  } catch (error) {
    if (error.errors) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// Delete incident
export const deleteIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const incident = await Incident.findById(id);

    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    // Delete image from Cloudinary if exists
    if (incident.image_url) {
      try {
        await deleteFromCloudinary(incident.image_url);
      } catch (error) {
        // Fail silently for image deletion
      }
    }

    await Incident.delete(id);

    // Send notification
    const fullName = await getUserFullName(req.user?.id);
    await notifyMultipleRoles(['general_manager', 'marketing_coordinator'], {
      title: "Incident Removed",
      message: `${fullName} removed an incident.`,
      type: "incident",
      entity_type: "incident",
      entity_id: id,
    });

    res.json({ message: "Incident deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};