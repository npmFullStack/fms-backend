import Truck from "../models/Truck.js";
import { truckSchema } from "../schemas/truckSchema.js";

// Create new truck
export const createTruck = async (req, res) => {
  try {
    const validated = truckSchema.parse(req.body);
    const truck = await Truck.create(validated);
    res.status(201).json(truck);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all trucks
export const getTrucks = async (req, res) => {
  try {
    const trucks = await Truck.getAll();
    res.json(trucks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single truck
export const getTruck = async (req, res) => {
  try {
    const truck = await Truck.findById(req.params.id);
    if (!truck) return res.status(404).json({ error: "Truck not found" });
    res.json(truck);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get trucks by company
export const getTrucksByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const trucks = await Truck.findByCompany(companyId);
    res.json(trucks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update truck
export const updateTruck = async (req, res) => {
  try {
    const { id } = req.params;
    const validated = truckSchema.partial().parse(req.body);
    await Truck.update(id, validated);
    res.json({ message: "Truck updated successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete truck
export const deleteTruck = async (req, res) => {
  try {
    const { id } = req.params;
    await Truck.delete(id);
    res.json({ message: "Truck deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};