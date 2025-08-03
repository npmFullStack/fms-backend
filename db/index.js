import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.EXTERNAL_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Render PostgreSQL
  }
});

const testDbConnection = async () => {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("Db connected:", res.rows[0].now);
  } catch (err) {
    console.error("Database connection error:", err);
    process.exit(1); // Exit if DB connection fails
  }
};

testDbConnection();