import { v4 as uuidv4 } from "uuid";
import {
    getAllTruckingCompanies,
    getTruckingCompanyById,
    createTruckingCompany,
    updateTruckingCompany,
    toggleTruckingCompanyStatus
} from "../models/TruckingCompany.js";
import { partnerSchema } from "../schemas/partnerSchema.js";
import {
    uploadToCloudinary,
    deleteFromCloudinary
} from "../utils/imageUtils.js";

export const getTruckingCompanies = async (req, res) => {
    try {
        const result = await getAllTruckingCompanies();
        res.json(result.rows);
    } catch (error) {
        console.error("Error getting trucking companies:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getTruckingCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await getTruckingCompanyById(id);

        if (!result.rows.length) {
            return res
                .status(404)
                .json({ message: "Trucking company not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error getting trucking company:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const addTruckingCompany = async (req, res) => {
    let logoUrl = null;
    let publicId = null;

    try {
        // Handle image upload if exists
        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer);
            logoUrl = result.secure_url;
            publicId = result.public_id;
        }

        const truckingCompanyData = {
            name: req.body.name,
            logoUrl: logoUrl
        };

        // Validate data
        partnerSchema.parse(truckingCompanyData);

        const id = uuidv4();
        await createTruckingCompany(
            id,
            truckingCompanyData.name,
            truckingCompanyData.logoUrl
        );

        res.status(201).json({
            message: "Trucking company created successfully",
            truckingCompany: { id, ...truckingCompanyData }
        });
    } catch (error) {
        // Clean up uploaded image if error occurs
        if (publicId) {
            await deleteFromCloudinary(publicId);
        }

        console.error("Error creating trucking company:", error);

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

export const editTruckingCompany = async (req, res) => {
    let logoUrl = null;
    let publicId = null;

    try {
        const { id } = req.params;
        const currentTruckingCompany = await getTruckingCompanyById(id);

        if (!currentTruckingCompany.rows.length) {
            return res
                .status(404)
                .json({ message: "Trucking company not found" });
        }

        // Handle new image upload
        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer);
            logoUrl = result.secure_url;
            publicId = result.public_id;
        } else {
            // Keep existing logo if no new file uploaded
            logoUrl = currentTruckingCompany.rows[0].logo_url;
        }

        const truckingCompanyData = {
            name: req.body.name || currentTruckingCompany.rows[0].name,
            logoUrl: logoUrl
        };

        // Validate data
        partnerSchema.parse(truckingCompanyData);

        await updateTruckingCompany(
            id,
            truckingCompanyData.name,
            truckingCompanyData.logoUrl
        );

        res.json({
            message: "Trucking company updated successfully",
            truckingCompany: { id, ...truckingCompanyData }
        });
    } catch (error) {
        // Clean up uploaded image if error occurs
        if (publicId) {
            await deleteFromCloudinary(publicId);
        }

        console.error("Error updating trucking company:", error);

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

export const toggleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await toggleTruckingCompanyStatus(id);

        if (!result.rows.length) {
            return res
                .status(404)
                .json({ message: "Trucking company not found" });
        }

        res.json({
            message: `Trucking company ${
                result.rows[0].is_active ? "activated" : "deactivated"
            }`,
            truckingCompany: result.rows[0]
        });
    } catch (error) {
        console.error("Error toggling trucking company status:", error);
        res.status(500).json({ message: "Server error" });
    }
};
