import Container from "../models/Container.js";
import { containerSchema } from "../schemas/containerSchema.js";

// Create new container
export const addContainer = async (req, res) => {
  try {
    const validated = containerSchema.parse(req.body);
    const container = await Container.create(validated);
    res.status(201).json(container);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get returned containers for booking
export const getLineContainers = async (req, res) => {
  try {
    const { shippingLineId } = req.params;
    const containers = await Container.getReturnedByLine(shippingLineId);
    res.json(containers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all containers for management
export const getAllLineContainers = async (req, res) => {
  try {
    const { shippingLineId } = req.params;
    const containers = await Container.getAllByLine(shippingLineId);
    res.json(containers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single container
export const getContainer = async (req, res) => {
  try {
    const container = await Container.findById(req.params.id);
    if (!container) {
      return res.status(404).json({ error: "Container not found" });
    }
    res.json(container);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update container
export const editContainer = async (req, res) => {
  try {
    const { id } = req.params;
    const validated = containerSchema.partial().parse(req.body);
    const updatedContainer = await Container.update(id, validated);
    res.json(updatedContainer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete container
export const removeContainer = async (req, res) => {
  try {
    const { id } = req.params;
    await Container.delete(id);
    res.json({ message: "Container deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get available containers for booking
export const getAvailableContainers = async (req, res) => {
  try {
    const { shipping_line_id } = req.params;
    const containers = await Container.getAvailable(shipping_line_id);
    res.json(containers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};