// reset-db.js
import { pool } from "../db/index.js";
import dotenv from "dotenv";

dotenv.config();

async function resetDatabase() {
    try {
        // 1. Drop triggers (if any exist)
        const tablesWithTrigger = [
            "users",
            "user_details",
            "shipping_lines",
            "ships",
            "containers",
            "trucking_companies",
            "trucks",
            "bookings",
            "booking_containers"
        ];

        for (const table of tablesWithTrigger) {
            await pool.query(`DROP TRIGGER IF EXISTS trigger_update_updated_at_${table} ON ${table} CASCADE;`);
        }

        // 2. Drop the update function
        await pool.query(`DROP FUNCTION IF EXISTS update_updated_at() CASCADE;`);

        // 3. Drop all tables (CASCADE handles FKs)
        await pool.query(`
      DROP TABLE IF EXISTS 
        booking_containers,
        booking_status_history,
        booking_delivery_addresses,
        booking_pickup_addresses,
        booking_consignee_details,
        booking_shipper_details,
        bookings,
        trucks,
        trucking_companies,
        containers,
        ships,
        shipping_lines,
        user_details,
        users
      CASCADE;
    `);

        // 4. Drop sequences
        await pool.query(`DROP SEQUENCE IF EXISTS booking_number_seq CASCADE;`);
        await pool.query(`DROP SEQUENCE IF EXISTS hwb_number_seq CASCADE;`);

        // 5. Drop custom enums
        await pool.query(`DROP TYPE IF EXISTS payment_status CASCADE;`);
        await pool.query(`DROP TYPE IF EXISTS booking_status CASCADE;`);
        await pool.query(`DROP TYPE IF EXISTS booking_mode CASCADE;`);
        await pool.query(`DROP TYPE IF EXISTS container_type CASCADE;`);
        await pool.query(`DROP TYPE IF EXISTS user_role CASCADE;`);

        console.log(
            "✅ Database reset complete (all tables, triggers, sequences, enums, and functions dropped)"
        );
        process.exit(0);
    } catch (error) {
        console.error("❌ Error resetting database:", error);
        process.exit(1);
    }
}

resetDatabase();
