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
      END $$;
    `);

        // 3) Updated-at trigger function
        await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

        // ==================== CORE USERS ====================
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

        // ==================== PARTNERS ====================
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
        shipping_line_id UUID PRIMARY KEY REFERENCES shipping_lines(id) ON DELETE CASCADE,
        logo_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

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
        trucking_company_id UUID PRIMARY KEY REFERENCES trucking_companies(id) ON DELETE CASCADE,
        logo_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

        // ==================== SHIPPING ====================
        await pool.query(`
  CREATE TABLE IF NOT EXISTS ships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipping_line_id UUID NOT NULL REFERENCES shipping_lines(id) ON DELETE CASCADE,
    vessel_number VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`);

        await pool.query(`
  CREATE TABLE IF NOT EXISTS ship_details (
    ship_id UUID PRIMARY KEY REFERENCES ships(id) ON DELETE CASCADE,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`);

        await pool.query(`
  CREATE TABLE IF NOT EXISTS containers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ship_id UUID NOT NULL REFERENCES ships(id) ON DELETE CASCADE,
    size container_type NOT NULL,
    van_number VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (ship_id, van_number)
  );
`);

        // ==================== TRUCKING ====================
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
        truck_id UUID PRIMARY KEY REFERENCES trucks(id) ON DELETE CASCADE,
        remarks TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

        await pool.query(`
      CREATE TABLE IF NOT EXISTS trucking_routes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        trucking_company_id UUID NOT NULL REFERENCES trucking_companies(id) ON DELETE CASCADE,
        origin VARCHAR(100) NOT NULL,
        destination VARCHAR(100) NOT NULL,
        rate DECIMAL(10,2) NOT NULL,
        valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
        valid_to DATE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (trucking_company_id, origin, destination, valid_from)
      );
    `);

     // ==================== BOOKINGS ====================
    await pool.query(`
      CREATE SEQUENCE IF NOT EXISTS booking_number_seq START 1;
      CREATE SEQUENCE IF NOT EXISTS hwb_number_seq START 1;

      CREATE TABLE IF NOT EXISTS bookings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        marketing_coordinator_id UUID REFERENCES users(id) ON DELETE SET NULL,
        
        -- Shipping Information
        shipping_line_id UUID NOT NULL REFERENCES shipping_lines(id) ON DELETE CASCADE,
        ship_id UUID REFERENCES ships(id) ON DELETE SET NULL,
        booking_mode booking_mode NOT NULL,
        
        -- Route Information
        origin VARCHAR(100) NOT NULL,
        destination VARCHAR(100) NOT NULL,
        pickup_lat DECIMAL(10, 8),
        pickup_lng DECIMAL(11, 8),
        delivery_lat DECIMAL(10, 8),
        delivery_lng DECIMAL(11, 8),
        
        -- Dates
        preferred_departure DATE NOT NULL,
        preferred_delivery DATE,
        actual_departure DATE,
        actual_arrival DATE,
        actual_delivery DATE,
        
        -- Status
        status VARCHAR(50) DEFAULT 'BOOKED',
        payment_status payment_status DEFAULT 'PENDING',
        
        -- Auto-generated Numbers
        booking_number VARCHAR(50) UNIQUE,
        hwb_number VARCHAR(50) UNIQUE,
        
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Function to generate booking_number
      CREATE OR REPLACE FUNCTION generate_booking_number()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.booking_number := 'BKG-' || to_char(NOW(), 'YYYYMMDD') || '-' ||
          LPAD(nextval('booking_number_seq')::text, 4, '0');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Function to generate hwb_number
      CREATE OR REPLACE FUNCTION generate_hwb_number()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.hwb_number := 'HWB-' || to_char(NOW(), 'YYYYMMDD') || '-' ||
          LPAD(nextval('hwb_number_seq')::text, 4, '0');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Trigger for booking_number
      DROP TRIGGER IF EXISTS booking_number_trigger ON bookings;
      CREATE TRIGGER booking_number_trigger
      BEFORE INSERT ON bookings
      FOR EACH ROW
      EXECUTE FUNCTION generate_booking_number();

      -- Trigger for hwb_number
      DROP TRIGGER IF EXISTS hwb_number_trigger ON bookings;
      CREATE TRIGGER hwb_number_trigger
      BEFORE INSERT ON bookings
      FOR EACH ROW
      EXECUTE FUNCTION generate_hwb_number();
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS booking_details (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
        
        container_type container_type NOT NULL,
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


    await pool.query(`
      CREATE TABLE IF NOT EXISTS booking_details (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
        
        container_type container_type NOT NULL,
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
  "users", "user_details", "shipping_lines", "shipping_line_details", 
  "trucking_companies", "trucking_company_details", "ships", "ship_details", 
  "containers", "trucks", "truck_details", 
  "trucking_routes", "bookings", "booking_details"
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
