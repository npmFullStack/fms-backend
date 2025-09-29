// controllers/truckController.js
import { truckSchema } from "../schemas/truckSchema.js";
import {
  createTruck as createTruckModel,
  getAllTrucks,
  getTruckById,
  updateTruck as updateTruckModel,
  deleteTruck as deleteTruckModel
} from "../models/Truck.js";

export const createTruck = async (req, res) => {
    try {
        const validated = truckSchema.parse(req.body);
        const truck = await createTruckModel(validated);
        res.status(201).json(truck);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const getTrucks = async (req, res) => {
  try {
    const trucks = await getAllTrucks();
    res.json(trucks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getTruck = async (req, res) => {
  try {
    const truck = await getTruckById(req.params.id);
    if (!truck) return res.status(404).json({ error: "Truck not found" });
    res.json(truck);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateTruck = async (req, res) => {
  try {
    const { id } = req.params;
    const validated = truckSchema.partial().parse(req.body);
    await updateTruckModel(id, validated);
    res.json({ message: "Truck updated" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteTruck = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteTruckModel(id);
    res.json({ message: "Truck deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
