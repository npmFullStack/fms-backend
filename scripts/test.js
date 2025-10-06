import dotenv from "dotenv";
import Notification from "../models/Notification.js";
import { pool } from "../db/index.js";

dotenv.config();

const run = async () => {
  // ✅ Get any GM user to attach notification to
  const gm = await pool.query(`SELECT id FROM users WHERE role = 'general_manager' LIMIT 1`);
  if (gm.rows.length === 0) {
    console.log("❌ No general_manager user found");
    process.exit(1);
  }
  const gmId = gm.rows[0].id;

  console.log("🧪 Creating test notification for GM:", gmId);

  const notif = await Notification.create({
    user_id: gmId,
    title: "Test Notification",
    message: "This is a direct DB insert test.",
    type: "test"
  });

  console.log("✅ Notification inserted:", notif);
  process.exit(0);
};

run();
