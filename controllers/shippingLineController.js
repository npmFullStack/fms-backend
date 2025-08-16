import { v4 as uuidv4 } from "uuid";
import {
  getAllShippingLines,
  getShippingLineById,
  createShippingLine,
  updateShippingLine,
  toggleShippingLineStatus,
} from "../models/ShippingLine.js";
import { shippingLineSchema } from "../schemas/shippingLineSchema.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/imageUtils.js";

export const getShippingLines = async (req, res) => {
  try {
    const result = await getAllShippingLines();
    res.json(result.rows);
  } catch (error) {
    console.error("Error getting shipping lines:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getShippingLine = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await getShippingLineById(id);

    if (!result.rows.length) {
      return res.status(404).json({ message: "Shipping line not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error getting shipping line:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const addShippingLine = async (req, res) => {
  let logoUrl = null;
  let publicId = null;

  try {
    // Handle image upload if exists
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      logoUrl = result.secure_url;
      publicId = result.public_id;
    }

    const shippingLineData = {
      name: req.body.name,
      logoUrl: logoUrl,
      contactEmail: req.body.contactEmail || null,
      contactPhone: req.body.contactPhone || null,
      website: req.body.website || null,
    };

    // Validate data
    shippingLineSchema.parse(shippingLineData);

    const id = uuidv4();
    await createShippingLine(
      id,
      shippingLineData.name,
      shippingLineData.logoUrl,
      shippingLineData.contactEmail,
      shippingLineData.contactPhone,
      shippingLineData.website
    );

    res.status(201).json({
      message: "Shipping line created successfully",
      shippingLine: { id, ...shippingLineData },
    });
  } catch (error) {
    // Clean up uploaded image if error occurs
    if (publicId) {
      await deleteFromCloudinary(publicId);
    }

    console.error("Error creating shipping line:", error);
    
    if (error.errors) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }

    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const editShippingLine = async (req, res) => {
  let logoUrl = null;
  let publicId = null;

  try {
    const { id } = req.params;
    const currentShippingLine = await getShippingLineById(id);

    if (!currentShippingLine.rows.length) {
      return res.status(404).json({ message: "Shipping line not found" });
    }

    // Handle new image upload
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      logoUrl = result.secure_url;
      publicId = result.public_id;
    } else {
      // Keep existing logo if no new file uploaded
      logoUrl = currentShippingLine.rows[0].logo_url;
    }

    const shippingLineData = {
      name: req.body.name || currentShippingLine.rows[0].name,
      logoUrl: logoUrl,
      contactEmail: req.body.contactEmail || currentShippingLine.rows[0].contact_email || null,
      contactPhone: req.body.contactPhone || currentShippingLine.rows[0].contact_phone || null,
      website: req.body.website || currentShippingLine.rows[0].website || null,
    };

    // Validate data
    shippingLineSchema.parse(shippingLineData);

    await updateShippingLine(
      id,
      shippingLineData.name,
      shippingLineData.logoUrl,
      shippingLineData.contactEmail,
      shippingLineData.contactPhone,
      shippingLineData.website
    );

    res.json({
      message: "Shipping line updated successfully",
      shippingLine: { id, ...shippingLineData },
    });
  } catch (error) {
    // Clean up uploaded image if error occurs
    if (publicId) {
      await deleteFromCloudinary(publicId);
    }

    console.error("Error updating shipping line:", error);
    
    if (error.errors) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }

    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await toggleShippingLineStatus(id);

    if (!result.rows.length) {
      return res.status(404).json({ message: "Shipping line not found" });
    }

    res.json({
      message: `Shipping line ${result.rows[0].is_active ? "activated" : "deactivated"}`,
      shippingLine: result.rows[0],
    });
  } catch (error) {
    console.error("Error toggling shipping line status:", error);
    res.status(500).json({ message: "Server error" });
  }
};