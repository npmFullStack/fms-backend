import Ship from "../models/Ship.js";
import { shipSchema } from "../schemas/shipSchema.js";

// Create new ship
export const createShip = async (req, res) => {
  try {
    const validated = shipSchema.parse(req.body);
    const ship = await Ship.create(validated);
    res.status(201).json(ship);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all ships
export const getShips = async (req, res) => {
  try {
    const ships = await Ship.getAll();
    res.json(ships);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single ship
export const getShip = async (req, res) => {
  try {
    const ship = await Ship.findById(req.params.id);
    if (!ship) return res.status(404).json({ error: "Ship not found" });
    res.json(ship);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get ships by shipping line
export const getShipsByLine = async (req, res) => {
  try {
    const { lineId } = req.params;
    const ships = await Ship.findByShippingLine(lineId);
    res.json(ships);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update ship
export const updateShip = async (req, res) => {
  try {
    const { id } = req.params;
    const updateSchema = shipSchema.partial();
    const validated = updateSchema.parse(req.body);

    await Ship.update(id, validated);
    res.json({ message: "Ship updated successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete ship
export const deleteShip = async (req, res) => {
  try {
    const { id } = req.params;
    await Ship.delete(id);
    res.json({ message: "Ship deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};