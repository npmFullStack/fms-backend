// controllers/apController.js
import AP from "../models/AP.js";

export const getAPRecords = async (req, res) => {
  try {
    const data = await AP.getAll();
    res.json(data);
  } catch (err) {
    console.error("getAPRecords error:", err);
    res.status(500).json({ error: "Failed to fetch AP records" });
  }
};

export const upsertAPRecord = async (req, res) => {
  try {
    const { apId } = req.params;
    const result = await AP.upsert(apId, req.body);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error("upsertAPRecord error:", err);
    res.status(500).json({ success: false, error: "Failed to save AP record" });
  }
};
