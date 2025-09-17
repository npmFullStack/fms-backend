// create-tables.js
import { pool } from "../db/index.js";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

dotenv.config();

async function createTables() {
    try {
        // 1) Extensions
        await pool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        // 2) Enums
        await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
          CREATE TYPE user_role AS ENUM (
            'customer',
            'marketing_coordinator',
            'admin_finance',
            'general_manager'
          );
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'container_type') THEN
          CREATE TYPE container_type AS ENUM ('LCL', '20FT', '40FT');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_mode') THEN
          CREATE TYPE booking_mode AS ENUM (
            'DOOR_TO_DOOR',
            'PIER_TO_PIER',
            'CY_TO_DOOR',
            'DOOR_TO_CY',
            'CY_TO_CY'
          );
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
          CREATE TYPE payment_status AS ENUM ('PENDING', 'PAID', 'OVERDUE');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
          CREATE TYPE booking_status AS ENUM (
            'PENDING',
            'PICKUP',
            'IN_PORT',
            'IN_TRANSIT',
            'DELIVERED'
          );
        END IF;
      END $$;
    `);

        // 3) Updated-at trigger
        await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

        // ==================== USERS ====================
        await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(100) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role user_role DEFAULT 'customer',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

        await pool.query(`
      CREATE TABLE IF NOT EXISTS user_details (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        phone VARCHAR(20),
        profile_picture TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

        // ==================== SHIPPING LINES ====================
        await pool.query(`
      CREATE TABLE IF NOT EXISTS shipping_lines (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(150) UNIQUE NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

        await pool.query(`
      CREATE TABLE IF NOT EXISTS shipping_line_details (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        shipping_line_id UUID NOT NULL REFERENCES shipping_lines(id) ON DELETE CASCADE,
        logo_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

        await pool.query(`
      CREATE TABLE IF NOT EXISTS ships (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        shipping_line_id UUID NOT NULL REFERENCES shipping_lines(id) ON DELETE CASCADE,
        vessel_number VARCHAR(50) NOT NULL,
        ship_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

        await pool.query(`
      CREATE TABLE IF NOT EXISTS ship_details (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        ship_id UUID NOT NULL UNIQUE REFERENCES ships(id) ON DELETE CASCADE,
        remarks TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

        await pool.query(`
      CREATE TABLE IF NOT EXISTS containers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipping_line_id UUID NOT NULL REFERENCES shipping_lines(id) ON DELETE CASCADE,
  size container_type NOT NULL,
  van_number VARCHAR(100) NOT NULL,
  is_returned BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (shipping_line_id, van_number)
);

    `);

        // ==================== TRUCKING ====================
        await pool.query(`
      CREATE TABLE IF NOT EXISTS trucking_companies (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(150) UNIQUE NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

        await pool.query(`
      CREATE TABLE IF NOT EXISTS trucking_company_details (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        trucking_company_id UUID NOT NULL REFERENCES trucking_companies(id) ON DELETE CASCADE,
        logo_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

        await pool.query(`
      CREATE TABLE IF NOT EXISTS trucks (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        trucking_company_id UUID NOT NULL REFERENCES trucking_companies(id) ON DELETE CASCADE,
        name VARCHAR(150) NOT NULL,
        plate_number VARCHAR(50),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (trucking_company_id, name)
      );
    `);

        await pool.query(`
      CREATE TABLE IF NOT EXISTS truck_details (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        truck_id UUID NOT NULL UNIQUE REFERENCES trucks(id) ON DELETE CASCADE,
        remarks TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

        // ==================== BOOKINGS ====================
        await pool.query(`
      CREATE SEQUENCE IF NOT EXISTS booking_number_seq START 1;
      CREATE SEQUENCE IF NOT EXISTS hwb_number_seq START 1;

      CREATE TABLE IF NOT EXISTS bookings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

        shipper VARCHAR(150) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(20),

        shipping_line_id UUID NOT NULL REFERENCES shipping_lines(id) ON DELETE CASCADE,
        ship_id UUID REFERENCES ships(id) ON DELETE SET NULL,
        container_id UUID REFERENCES containers(id) ON DELETE SET NULL,
        quantity INTEGER DEFAULT 1,
        booking_mode booking_mode NOT NULL,
        commodity VARCHAR(200) NOT NULL,

        origin_port VARCHAR(100) NOT NULL,
        destination_port VARCHAR(100) NOT NULL,

        pickup_lat DECIMAL(10,8),
        pickup_lng DECIMAL(11,8),
        delivery_lat DECIMAL(10,8),
        delivery_lng DECIMAL(11,8),

        preferred_departure DATE NOT NULL,
        preferred_delivery DATE,
        actual_departure DATE,
        actual_arrival DATE,
        actual_delivery DATE,

        status booking_status DEFAULT 'PENDING',
        payment_status payment_status DEFAULT 'PENDING',

        booking_number VARCHAR(50) UNIQUE,
        hwb_number VARCHAR(50) UNIQUE,

        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

        await pool.query(`
      CREATE TABLE IF NOT EXISTS booking_details (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
        quantity INTEGER DEFAULT 1,
        commodity VARCHAR(200) NOT NULL,
        pickup_trucker_id UUID REFERENCES trucking_companies(id) ON DELETE SET NULL,
        pickup_truck_id UUID REFERENCES trucks(id) ON DELETE SET NULL,
        delivery_trucker_id UUID REFERENCES trucking_companies(id) ON DELETE SET NULL,
        delivery_truck_id UUID REFERENCES trucks(id) ON DELETE SET NULL,

        remarks TEXT,

        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

        // ==================== TRIGGERS ====================
        const tablesForTrigger = [
            "users",
            "user_details",
            "shipping_lines",
            "shipping_line_details",
            "ships",
            "ship_details",
            "containers",
            "trucking_companies",
            "trucking_company_details",
            "trucks",
            "truck_details",
            "bookings",
            "booking_details"
        ];

        for (const t of tablesForTrigger) {
            await pool.query(`
        DROP TRIGGER IF EXISTS trigger_update_updated_at_${t} ON ${t};
        CREATE TRIGGER trigger_update_updated_at_${t}
        BEFORE UPDATE ON ${t}
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at();
      `);
        }

        // ==================== ADMIN SEED ====================
        const hashedPassword = await bcrypt.hash("admin123", 10);
        await pool.query(
            `WITH new_user AS (
        INSERT INTO users (email, password, role)
        VALUES ('admin@gmail.com', $1, 'general_manager')
        ON CONFLICT (email) DO NOTHING
        RETURNING id
      )
      INSERT INTO user_details (user_id, first_name, last_name)
      SELECT id, 'Admin', 'User' FROM new_user
      ON CONFLICT (user_id) DO NOTHING;`,
            [hashedPassword]
        );

        console.log("All tables created successfully");
        process.exit(0);
    } catch (error) {
        console.error("Error creating tables:", error);
        process.exit(1);
    }
}

createTables();
