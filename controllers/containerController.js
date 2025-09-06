import {
  createContainer as createContainerModel,
  getContainersByShip,
  getContainerById,
  updateContainer as updateContainerModel,
  deleteContainer as deleteContainerModel,
} from "../models/Container.js";
import { containerSchema } from "../schemas/containerSchema.js";

// Create
export const createContainer = async (req, res) => {
  try {
    const validated = containerSchema.parse(req.body);
    const container = await createContainerModel(validated);
    res.status(201).json(container);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all for ship
export const getContainers = async (req, res) => {
  try {
    const containers = await getContainersByShip(req.params.shipId);
    res.json(containers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get one
export const getContainer = async (req, res) => {
  try {
    const container = await getContainerById(req.params.id);
    if (!container) return res.status(404).json({ error: "Container not found" });
    res.json(container);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update
export const updateContainer = async (req, res) => {
  try {
    const { id } = req.params;
    const validated = containerSchema.partial().parse(req.body);
    const updated = await updateContainerModel(id, validated);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete
export const deleteContainer = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteContainerModel(id);
    res.json({ message: "Container deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
