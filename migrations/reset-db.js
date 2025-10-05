// reset-db.js
import { pool } from "../db/index.js";
import dotenv from "dotenv";

dotenv.config();

async function resetDatabase() {
  try {
    console.log("🔄 Resetting database...");

    // Drop triggers
    const tablesWithTrigger = [
      "users",
      "user_details",
      "shipping_lines",
      "ships",
      "containers",
      "trucking_companies",
      "trucks",
      "bookings",
      "booking_containers",
    ];

    for (const table of tablesWithTrigger) {
      await pool.query(
        `DROP TRIGGER IF EXISTS trigger_update_updated_at_${table} ON ${table} CASCADE;`
      );
    }

    //  Drop update function
    await pool.query(`DROP FUNCTION IF EXISTS update_updated_at() CASCADE;`);

    // Drop indexes explicitly (to ensure full cleanup)
    const indexes = [
      "idx_containers_is_returned",
      "idx_containers_shipping_line_returned",
      "idx_booking_containers_booking_id",
      "idx_booking_containers_container_id",
      "idx_notifications_user_id",
      "idx_notifications_is_read",
      "idx_notifications_created_at",
    ];

    for (const idx of indexes) {
      await pool.query(`DROP INDEX IF EXISTS ${idx} CASCADE;`);
    }

    //  Drop tables (CASCADE handles dependencies)
    await pool.query(`
      DROP TABLE IF EXISTS 
        notifications,
        password_resets,
        booking_status_history,
        booking_delivery_addresses,
        booking_pickup_addresses,
        booking_truck_assignments,
        booking_consignee_details,
        booking_shipper_details,
        booking_containers,
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

//  Drop views
await pool.query(`DROP VIEW IF EXISTS booking_summary CASCADE;`);

    // Drop sequences
    await pool.query(`DROP SEQUENCE IF EXISTS booking_number_seq CASCADE;`);
    await pool.query(`DROP SEQUENCE IF EXISTS hwb_number_seq CASCADE;`);

    // Drop custom enum types
    await pool.query(`DROP TYPE IF EXISTS payment_status CASCADE;`);
    await pool.query(`DROP TYPE IF EXISTS booking_status CASCADE;`);
    await pool.query(`DROP TYPE IF EXISTS booking_mode CASCADE;`);
    await pool.query(`DROP TYPE IF EXISTS container_type CASCADE;`);
    await pool.query(`DROP TYPE IF EXISTS user_role CASCADE;`);

    // Drop extension
    await pool.query(`DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;`);

    console.log("✅ Database reset complete (all tables, triggers, indexes, sequences, enums, and functions dropped)");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error resetting database:", error);
    process.exit(1);
  }
}

resetDatabase();
