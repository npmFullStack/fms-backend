import { pool } from "../db/index.js";
import dotenv from "dotenv";

dotenv.config();

async function resetDatabase() {
    try {
        await pool.query("DROP TABLE IF EXISTS users CASCADE");
        console.log("Database reset complete");
        process.exit(0);
    } catch (error) {
        console.error("Error resetting database:", error);
        process.exit(1);
    }
}

resetDatabase();
