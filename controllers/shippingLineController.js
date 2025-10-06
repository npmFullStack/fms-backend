import { v4 as uuidv4 } from "uuid";
import ShippingLine from "../models/ShippingLine.js";
import { partnerSchema } from "../schemas/partnerSchema.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/imageUtils.js";
import { notifyMultipleRoles, getUserFullName } from
"../utils/notificationService.js";

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

    const shippingLine = await ShippingLine.create(id, name, null);

    const fullName = await getUserFullName(req.user?.id);

    await notifyMultipleRoles(["marketing_coordinator", "general_manager"], {
      title: "New Shipping Line Added",
      message: `${fullName} added a new shipping line "${name}".`,
      type: "shipping_line",
      entity_type: "shipping_line",
      entity_id: shippingLine.id,
    });

    res.status(201).json({
      message: "Shipping line created successfully",
      shippingLine,
    });

    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer);
        await ShippingLine.update(id, name, result.secure_url);
      } catch {
        // No console.log — fail silently
      }
    }
  } catch (error) {
    if (error.errors) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// Update shipping line
export const editShippingLine = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const currentShippingLine = await ShippingLine.findById(id);
    if (!currentShippingLine) {
      return res.status(404).json({ message: "Shipping line not found" });
    }

    let logoUrl = currentShippingLine.logo_url;

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      logoUrl = result.secure_url;
    }

    const validatedData = partnerSchema.parse({ name, logoUrl });

    const updatedShippingLine = await ShippingLine.update(
      id,
      validatedData.name,
      validatedData.logoUrl
    );

    const fullName = await getUserFullName(req.user?.id);

    await notifyMultipleRoles(["marketing_coordinator", "general_manager"], {
      title: "Shipping Line Updated",
      message: `${fullName} updated the shipping line "${validatedData.name}".`,
      type: "shipping_line",
      entity_type: "shipping_line",
      entity_id: id,
    });

    res.json({
      message: "Shipping line updated successfully",
      shippingLine: updatedShippingLine,
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
    const shippingLine = await ShippingLine.findById(id);

    if (!shippingLine) {
      return res.status(404).json({ message: "Shipping line not found" });
    }

    await ShippingLine.delete(id);

    const fullName = await getUserFullName(req.user?.id);

    await notifyMultipleRoles(["marketing_coordinator", "general_manager"], {
      title: "Shipping Line Removed",
      message: `${fullName} removed the shipping line "${shippingLine.name}".`,
      type: "shipping_line",
      entity_type: "shipping_line",
      entity_id: id,
    });

    res.json({ message: "Shipping line deleted successfully" });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};
