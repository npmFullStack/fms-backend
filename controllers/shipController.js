// controllers/shipController.js

import * as Ship from "../models/Ship.js";
import { shipSchema } from "../schemas/shipSchema.js";

// Create ship
export const createShip = async (req, res) => {
  try {
    const validated = shipSchema.parse(req.body);
    const ship = await Ship.createShip(validated);
    res.status(201).json(ship);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all ships
export const getShips = async (req, res) => {
  try {
    const ships = await Ship.getAllShips();
    res.json(ships);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single ship
export const getShip = async (req, res) => {
  try {
    const ship = await Ship.getShipById(req.params.id);
    if (!ship) return res.status(404).json({ error: "Ship not found" });
    res.json(ship);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getShipsByLine = async (req, res) => {
  try {
    const { lineId } = req.params;
    const ships = await Ship.getAllShips();
    const filtered = ships.filter(ship => ship.shipping_line_id == lineId);
    res.json({ ships: filtered });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Update ship (shipName + vesselNumber + remarks)
export const updateShip = async (req, res) => {
  try {
    const { id } = req.params;

    // allow partial updates
    const updateSchema = shipSchema.partial();
    const validated = updateSchema.parse(req.body);

    await Ship.updateShip(id, validated);
    res.json({ message: "Ship updated" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete ship
export const deleteShip = async (req, res) => {
  try {
    const { id } = req.params;
    await Ship.deleteShip(id);
    res.json({ message: "Ship deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
