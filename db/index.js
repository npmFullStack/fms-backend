import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

export const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

const testDbConnection = async () => {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("Db connected:", res.rows[0].now);
  } catch (err) {
    console.error("Database connection error:", err);
  }
};

testDbConnection();
