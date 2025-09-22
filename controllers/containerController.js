import {
    createContainer,
    getContainersByLine,
    getContainerById,
    getAvailableContainer,
    updateContainer,
    deleteContainer
} from "../models/Container.js";
import { containerSchema } from "../schemas/containerSchema.js";

// Create container
export const addContainer = async (req, res) => {
    try {
        const validated = containerSchema.parse(req.body);
        const container = await createContainer(validated);
        res.status(201).json(container);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Get all containers for a line
export const getLineContainers = async (req, res) => {
    try {
        const { shippingLineId } = req.params;
        const containers = await getContainersByLine(shippingLineId);
        res.json(containers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get container by id
export const getContainer = async (req, res) => {
    try {
        const container = await getContainerById(req.params.id);
        if (!container)
            return res.status(404).json({ error: "Container not found" });
        res.json(container);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update container
export const editContainer = async (req, res) => {
    try {
        const { id } = req.params;
        const validated = containerSchema.partial().parse(req.body);
        const updated = await updateContainer(id, validated);
        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Delete container
export const removeContainer = async (req, res) => {
    try {
        const { id } = req.params;
        await deleteContainer(id);
        res.json({ message: "Container deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// New endpoint to get available containers for a shipping line
export const getAvailableContainers = async (req, res) => {
    try {
        const { shipping_line_id } = req.params;
        const containers = await getAvailableContainer(shipping_line_id);
        res.json({ containers });
    } catch (err) {
        res.status(500).json({
            message: "Failed to fetch available containers",
            error: err.message
        });
    }
};
