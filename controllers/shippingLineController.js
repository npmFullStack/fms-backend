import { v4 as uuidv4 } from "uuid";
import {
    getAllShippingLines,
    getShippingLineById,
    createShippingLine,
    updateShippingLine,
    deleteShippingLineById
} from "../models/ShippingLine.js";
import { partnerSchema } from "../schemas/partnerSchema.js";
import {
    uploadToCloudinary,
    deleteFromCloudinary
} from "../utils/imageUtils.js";

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
  try {
    const id = uuidv4();

    // Insert partner first (without logo yet)
    await createShippingLine(id, req.body.name, null);

    // Respond immediately to frontend (faster success)
    res.status(201).json({
      message: "Shipping line created successfully",
      shippingLine: { id, name: req.body.name, logoUrl: null }
    });

    // If logo exists → upload async and update DB
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      await updateShippingLine(id, req.body.name, result.secure_url);
    }
  } catch (error) {
    console.error("Error creating shipping line:", error);
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
            logoUrl: logoUrl
        };

        // Validate data
        partnerSchema.parse(shippingLineData);

        await updateShippingLine(
            id,
            shippingLineData.name,
            shippingLineData.logoUrl
        );

        res.json({
            message: "Shipping line updated successfully",
            shippingLine: { id, ...shippingLineData }
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
                errors: error.errors
            });
        }

        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

export const deleteShippingLine = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteShippingLineById(id);

    if (!result.rowCount) {
      return res.status(404).json({ message: "Shipping line not found" });
    }

    res.json({ message: "Shipping line removed successfully" });
  } catch (error) {
    console.error("Error deleting shipping line:", error);
    res.status(500).json({ message: "Server error" });
  }
};
