// reset-db.js
import { pool } from "../db/index.js";
import dotenv from "dotenv";

dotenv.config();

async function resetDatabase() {
    try {
        // 1. Drop triggers + function
        await pool.query(
            `DROP FUNCTION IF EXISTS update_updated_at() CASCADE;`
        );

        // 2. Drop all tables (CASCADE handles FKs + dependent objects)
        await pool.query(`
      DROP TABLE IF EXISTS 
        booking_containers,
        booking_status_history,
        bookings,
        truck_details,
        trucks,
        trucking_company_details,
        trucking_companies,
        containers,
        ship_details,
        ships,
        shipping_line_details,
        shipping_lines,
        user_details,
        users
      CASCADE;
    `);

        // 3. Drop sequences
        await pool.query(`DROP SEQUENCE IF EXISTS booking_number_seq CASCADE;`);
        await pool.query(`DROP SEQUENCE IF EXISTS hwb_number_seq CASCADE;`);

        // 4. Drop custom enums
        await pool.query(`DROP TYPE IF EXISTS payment_status CASCADE;`);
        await pool.query(`DROP TYPE IF EXISTS booking_status CASCADE;`);
        await pool.query(`DROP TYPE IF EXISTS booking_mode CASCADE;`);
        await pool.query(`DROP TYPE IF EXISTS container_type CASCADE;`);
        await pool.query(`DROP TYPE IF EXISTS user_role CASCADE;`);

        console.log(
            "✅ Database reset complete (all tables, sequences, enums, and functions dropped)"
        );
        process.exit(0);
    } catch (error) {
        console.error("❌ Error resetting database:", error);
        process.exit(1);
    }
}

resetDatabase();
