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
        name VARCHAR(150) NOT NULL,
        vessel_number VARCHAR(50),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (shipping_line_id, name)
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
      CREATE TABLE IF NOT EXISTS shipping_routes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        ship_id UUID NOT NULL REFERENCES ships(id) ON DELETE CASCADE,
        origin VARCHAR(100) NOT NULL,
        destination VARCHAR(100) NOT NULL,
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

// ========================= BOOKINGS =========================
await pool.query(`
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    marketing_coordinator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Shipping Information
    shipping_line_id UUID NOT NULL REFERENCES shipping_lines(id) ON DELETE CASCADE,
    ship_id UUID REFERENCES ships(id) ON DELETE SET NULL,
    container_type container_type NOT NULL,
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
    
    -- Commodity
    commodity VARCHAR(200) NOT NULL,
    quantity INTEGER DEFAULT 1,
    
    -- Status
    status VARCHAR(50) DEFAULT 'BOOKED',
    payment_status payment_status DEFAULT 'PENDING',
    
    -- Financials
    freight_charge DECIMAL(12, 2),
    trucking_charge DECIMAL(12, 2),
    total_amount DECIMAL(12, 2),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`);

await pool.query(`
CREATE TABLE IF NOT EXISTS booking_trucking_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    trucking_company_id UUID NOT NULL REFERENCES trucking_companies(id) ON DELETE CASCADE,
    truck_id UUID REFERENCES trucks(id) ON DELETE SET NULL,
    assignment_type VARCHAR(20) NOT NULL CHECK (assignment_type IN ('PICKUP', 'DELIVERY')),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'PENDING'
);
`);

await pool.query(`
CREATE TABLE IF NOT EXISTS booking_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    document_url TEXT NOT NULL,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`);

await pool.query(`
CREATE TABLE IF NOT EXISTS booking_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`);

await pool.query(`
CREATE TABLE IF NOT EXISTS booking_issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    issue_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    reported_by UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'OPEN',
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`);

        // ==================== TRIGGERS ====================
        const tablesForTrigger = [
  "users", "user_details", "shipping_lines", "shipping_line_details", 
  "trucking_companies", "trucking_company_details", "ships", "ship_details", 
  "shipping_routes", "container_pricing", "trucks", "truck_details", 
  "trucking_routes", "bookings", "booking_trucking_assignments", 
  "booking_documents", "booking_status_history", "booking_issues"
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
