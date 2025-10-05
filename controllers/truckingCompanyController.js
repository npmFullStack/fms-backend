import { v4 as uuidv4 } from "uuid";
import TruckingCompany from "../models/TruckingCompany.js";
import { partnerSchema } from "../schemas/partnerSchema.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/imageUtils.js";

// Get all trucking companies
export const getTruckingCompanies = async (req, res) => {
  try {
    const companies = await TruckingCompany.getAll();
    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get single trucking company
export const getTruckingCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await TruckingCompany.findById(id);

    if (!company) {
      return res.status(404).json({ message: "Trucking company not found" });
    }

    res.json(company);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Create new trucking company
export const addTruckingCompany = async (req, res) => {
  try {
    const id = uuidv4();
    const { name } = req.body;

    // Create company without logo first
    const company = await TruckingCompany.create(id, name, null);

    // Respond immediately
    res.status(201).json({
      message: "Trucking company created successfully",
      company
    });

    // Upload logo in background if provided
    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer);
        await TruckingCompany.update(id, name, result.secure_url);
      } catch (uploadError) {
        console.error("Logo upload failed:", uploadError);
      }
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Update trucking company
export const editTruckingCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Get current company
    const currentCompany = await TruckingCompany.findById(id);
    if (!currentCompany) {
      return res.status(404).json({ message: "Trucking company not found" });
    }

    let logoUrl = currentCompany.logo_url;

    // Handle new logo upload
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      logoUrl = result.secure_url;
    }

    // Validate data
    const validatedData = partnerSchema.parse({ name, logoUrl });

    // Update company
    const updatedCompany = await TruckingCompany.update(
      id, 
      validatedData.name, 
      validatedData.logoUrl
    );

    res.json({
      message: "Trucking company updated successfully",
      company: updatedCompany
    });
  } catch (error) {
    if (error.errors) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// Delete trucking company
export const deleteTruckingCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await TruckingCompany.delete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Trucking company not found" });
    }

    res.json({ message: "Trucking company deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get success bookings count
export const getTruckingCompanySuccessBookings = async (req, res) => {
  try {
    const { id } = req.params;
    const totalSuccess = await TruckingCompany.getSuccessBookings(id);

    res.json({
      truckingCompanyId: id,
      totalSuccess
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};