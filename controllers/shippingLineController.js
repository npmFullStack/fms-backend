import { v4 as uuidv4 } from "uuid";
import ShippingLine from "../models/ShippingLine.js";
import { partnerSchema } from "../schemas/partnerSchema.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/imageUtils.js";

// Get all shipping lines
export const getShippingLines = async (req, res) => {
  try {
    const shippingLines = await ShippingLine.getAll();
    res.json(shippingLines);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get single shipping line
export const getShippingLine = async (req, res) => {
  try {
    const { id } = req.params;
    const shippingLine = await ShippingLine.findById(id);

    if (!shippingLine) {
      return res.status(404).json({ message: "Shipping line not found" });
    }

    res.json(shippingLine);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Create new shipping line
export const addShippingLine = async (req, res) => {
  try {
    const id = uuidv4();
    const { name } = req.body;

    // Create shipping line without logo first
    const shippingLine = await ShippingLine.create(id, name, null);

    // Respond immediately
    res.status(201).json({
      message: "Shipping line created successfully",
      shippingLine
    });

    // Upload logo in background if provided
    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer);
        await ShippingLine.update(id, name, result.secure_url);
      } catch (uploadError) {
        console.error("Logo upload failed:", uploadError);
      }
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Update shipping line
export const editShippingLine = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Get current shipping line
    const currentShippingLine = await ShippingLine.findById(id);
    if (!currentShippingLine) {
      return res.status(404).json({ message: "Shipping line not found" });
    }

    let logoUrl = currentShippingLine.logo_url;

    // Handle new logo upload
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      logoUrl = result.secure_url;
    }

    // Validate data
    const validatedData = partnerSchema.parse({ name, logoUrl });

    // Update shipping line
    const updatedShippingLine = await ShippingLine.update(
      id, 
      validatedData.name, 
      validatedData.logoUrl
    );

    res.json({
      message: "Shipping line updated successfully",
      shippingLine: updatedShippingLine
    });
  } catch (error) {
    if (error.errors) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// Delete shipping line
export const deleteShippingLine = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ShippingLine.delete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Shipping line not found" });
    }

    res.json({ message: "Shipping line deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get success bookings count
export const getShippingLineSuccessBookings = async (req, res) => {
  try {
    const { id } = req.params;
    const totalSuccess = await ShippingLine.getSuccessBookings(id);

    res.json({
      shippingLineId: id,
      totalSuccess
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};