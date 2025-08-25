import { 
  createShip as createShipModel, 
  getAllShips, 
  getShipById, 
  updateShip as updateShipModel, 
  deleteShip as deleteShipModel 
} from "../models/Ship.js";
import { shipSchema } from "../schemas/shipSchema.js";

export const createShip = async (req, res) => {
  try {
    const validated = shipSchema.parse(req.body);
    const ship = await createShipModel(validated);
    res.status(201).json(ship);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getShips = async (req, res) => {
  try {
    const ships = await getAllShips();
    res.json(ships);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getShip = async (req, res) => {
  try {
    const ship = await getShipById(req.params.id);
    if (!ship) return res.status(404).json({ error: "Ship not found" });
    res.json(ship);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateShip = async (req, res) => {
  try {
    const { id } = req.params;
    await updateShipModel(id, req.body);
    res.json({ message: "Ship updated" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteShip = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteShipModel(id);
    res.json({ message: "Ship deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};