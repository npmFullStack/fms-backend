import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

const connectionConfig = process.env.DATABASE_URL 
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_HOST === 'localhost' ? false : { rejectUnauthorized: false }
    }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT
    };

export const pool = new Pool(connectionConfig);

const testDbConnection = async () => {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("Db connected to:", process.env.DB_HOST);
    console.log("Timestamp:", res.rows[0].now);
  } catch (err) {
    console.error("Database connection error:", err);
    process.exit(1);
  }
};

testDbConnection();