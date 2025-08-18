import { pool } from "../db/index.js";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

dotenv.config();

async function createTables() {
  try {
    // 1) Extensions
    await pool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // 2) Enums (create if not exists)
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

    // ==================== CORE TABLES ====================
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

    // ==================== SHIPPING: SHIPS → ROUTES → CONTAINER PRICING ====================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ships (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        shipping_line_id UUID NOT NULL REFERENCES shipping_lines(id) ON DELETE CASCADE,
        name VARCHAR(150) NOT NULL,
        vessel_number VARCHAR(50),
        imo_number VARCHAR(50),
        capacity_teu INT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (shipping_line_id, name)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS shipping_routes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        ship_id UUID NOT NULL REFERENCES ships(id) ON DELETE CASCADE,
        origin VARCHAR(100) NOT NULL,
        destination VARCHAR(100) NOT NULL,
        sailing_days TEXT,
        transit_time INTERVAL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (ship_id, origin, destination)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS container_pricing (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        shipping_route_id UUID NOT NULL REFERENCES shipping_routes(id) ON DELETE CASCADE,
        container_type container_type NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
        valid_to DATE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (shipping_route_id, container_type, valid_from)
      );
    `);

    // ==================== TRUCKING: ROUTES ====================
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

    // ==================== BOOKING & OPERATIONS ====================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        hwb_number VARCHAR(50) UNIQUE NOT NULL,
        customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
        marketing_coordinator_id UUID REFERENCES users(id) ON DELETE SET NULL,
        shipper_id UUID REFERENCES users(id) ON DELETE SET NULL,
        consignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
        mode booking_mode NOT NULL,
        container_type container_type NOT NULL,
        status VARCHAR(50) DEFAULT 'PENDING',
        shipping_route_id UUID REFERENCES shipping_routes(id) ON DELETE SET NULL,
        trucking_route_id UUID REFERENCES trucking_routes(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT booking_route_choice CHECK (
          (shipping_route_id IS NOT NULL) <> (trucking_route_id IS NOT NULL)
        )
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS booking_details (
        booking_id UUID PRIMARY KEY REFERENCES bookings(id) ON DELETE CASCADE,
        carrier_booking_no VARCHAR(100),
        pickup_address TEXT,
        delivery_address TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS containers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
        container_no VARCHAR(20),
        seal_no VARCHAR(50),
        container_type container_type,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (container_no)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS cargo_monitoring (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
        atd TIMESTAMPTZ,
        ata TIMESTAMPTZ,
        delivery_date TIMESTAMPTZ,
        status VARCHAR(50) DEFAULT 'IN_TRANSIT',
        remarks TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS incident_reports (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        resolution TEXT,
        image_urls TEXT[],
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // ==================== HWB STRUCTURE ====================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS house_waybills (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
        origin VARCHAR(100) NOT NULL,
        destination VARCHAR(100) NOT NULL,
        pieces INT,
        chargeable_weight DECIMAL(10,2),
        description TEXT,
        container_id UUID REFERENCES containers(id) ON DELETE SET NULL,
        prepaid BOOLEAN DEFAULT TRUE,
        insured BOOLEAN DEFAULT FALSE,
        insured_value DECIMAL(12,2),
        remarks TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS hwb_numbers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        description TEXT,
        next_number BIGINT NOT NULL DEFAULT 1,
        padding INT NOT NULL DEFAULT 4,
        prefix TEXT DEFAULT '',
        suffix TEXT DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // ==================== SALES / FINANCE ====================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
        quoted_price DECIMAL(10,2) NOT NULL,
        final_price DECIMAL(10,2) NOT NULL,
        payment_status payment_status DEFAULT 'PENDING',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS sale_costs (
        sale_id UUID PRIMARY KEY REFERENCES sales(id) ON DELETE CASCADE,
        final_price DECIMAL(10,2) NOT NULL,
        shipping_cost DECIMAL(10,2) NOT NULL,
        trucking_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
        other_costs DECIMAL(10,2) DEFAULT 0,
        profit DECIMAL(10,2) GENERATED ALWAYS AS (
          final_price - shipping_cost - trucking_cost - other_costs
        ) STORED,
        margin DECIMAL(5,2) GENERATED ALWAYS AS (
          CASE
            WHEN final_price = 0 THEN 0
            ELSE (final_price - shipping_cost - trucking_cost - other_costs) / final_price * 100
          END
        ) STORED,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL,
        payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        reference_number VARCHAR(100),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // ==================== INDEXES FOR PERFORMANCE ====================
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_shipping_routes_od ON shipping_routes(origin, destination);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_trucking_routes_od ON trucking_routes(origin, destination);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_containers_container_no ON containers(container_no);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_bookings_hwb ON bookings(hwb_number);`);

    // Conditional index for shipper/consignee
    await pool.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'bookings'
          AND column_name = 'shipper_id'
        ) AND EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'bookings'
          AND column_name = 'consignee_id'
        ) THEN
          EXECUTE 'CREATE INDEX IF NOT EXISTS idx_bookings_parties ON bookings(shipper_id, consignee_id)';
        END IF;
      END$$;
    `);

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_hwb_booking ON house_waybills(booking_id);`);

    // ==================== TRIGGERS ====================
    const tablesForTrigger = [
      "users",
      "user_details",
      "shipping_lines",
      "shipping_line_details",
      "trucking_companies",
      "trucking_company_details",
      "ships",
      "shipping_routes",
      "container_pricing",
      "trucking_routes",
      "bookings",
      "booking_details",
      "containers",
      "sales",
      "sale_costs",
      "payments",
      "cargo_monitoring",
      "incident_reports",
      "house_waybills",
      "hwb_numbers"
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

    // ==================== ADMIN SEED (ONLY) ====================
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
