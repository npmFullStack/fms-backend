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
            'PIER_TO_PIER'
          );
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
          CREATE TYPE payment_status AS ENUM ('PENDING', 'PAID', 'OVERDUE');
        END IF;


IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
CREATE TYPE booking_status AS ENUM (
    'PICKUP_SCHEDULED',
    'LOADED_TO_TRUCK',
    'ARRIVED_ORIGIN_PORT',
    'LOADED_TO_SHIP',
    'IN_TRANSIT',
    'ARRIVED_DESTINATION_PORT',
    'OUT_FOR_DELIVERY',
    'DELIVERED'
);
END IF;

IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'paymongo_status') THEN
CREATE TYPE paymongo_status AS ENUM (
  'PENDING',
  'SUCCEEDED',
  'FAILED',
  'CANCELED'
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

        // ==================== PASSWORD RESET ====================
await pool.query(`
  CREATE TABLE IF NOT EXISTS password_resets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`);

        // ==================== SHIPPING LINES ====================
        await pool.query(`
  CREATE TABLE IF NOT EXISTS shipping_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) UNIQUE NOT NULL,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
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
      CREATE TABLE IF NOT EXISTS containers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        shipping_line_id UUID NOT NULL REFERENCES shipping_lines(id) ON DELETE CASCADE,
        size container_type NOT NULL,
        van_number VARCHAR(100) NOT NULL,
        is_returned BOOLEAN DEFAULT TRUE,
        returned_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
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
    logo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
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

        // ==================== BOOKINGS ====================
        await pool.query(`
CREATE SEQUENCE IF NOT EXISTS booking_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS hwb_number_seq START 1;

  CREATE TABLE IF NOT EXISTS bookings (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      shipping_line_id UUID NOT NULL REFERENCES shipping_lines(id) ON DELETE CASCADE,
      ship_id UUID REFERENCES ships(id) ON DELETE SET NULL,
      quantity INTEGER DEFAULT 1,
      booking_mode booking_mode NOT NULL,
      commodity VARCHAR(200) NOT NULL,
      origin_port VARCHAR(100) NOT NULL,
      destination_port VARCHAR(100) NOT NULL,
      status booking_status DEFAULT 'PICKUP_SCHEDULED',
      payment_status payment_status DEFAULT 'PENDING',
      booking_number VARCHAR(50) UNIQUE,
      hwb_number VARCHAR(50) UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`);

        // Shipper details
        await pool.query(`
  CREATE TABLE IF NOT EXISTS booking_shipper_details (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      company_name VARCHAR(150) NOT NULL,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      phone VARCHAR(20)
  );
`);

        // Consignee details
        await pool.query(`
  CREATE TABLE IF NOT EXISTS booking_consignee_details (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      company_name VARCHAR(150) NOT NULL,
      contact_name VARCHAR(100),
      phone VARCHAR(20)
  );
`);

        await pool.query(`
CREATE TABLE IF NOT EXISTS booking_truck_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    pickup_trucker_id UUID REFERENCES trucking_companies(id) ON DELETE SET NULL,
    pickup_truck_id UUID REFERENCES trucks(id) ON DELETE SET NULL,
    delivery_trucker_id UUID REFERENCES trucking_companies(id) ON DELETE SET NULL,
    delivery_truck_id UUID REFERENCES trucks(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`);
        // Pickup address
        await pool.query(`
  CREATE TABLE IF NOT EXISTS booking_pickup_addresses (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      province VARCHAR(255),
      city VARCHAR(255),
      barangay VARCHAR(255),
      street VARCHAR(255)
        );
`);

        // Delivery address
        await pool.query(`
  CREATE TABLE IF NOT EXISTS booking_delivery_addresses (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      province VARCHAR(255),
      city VARCHAR(255),
      barangay VARCHAR(255),
      street VARCHAR(255)
    );
`);

        // for multiple containers per booking
        await pool.query(`
      CREATE TABLE IF NOT EXISTS booking_containers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
        container_id UUID NOT NULL REFERENCES containers(id) ON DELETE CASCADE,
        sequence_number INTEGER NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(booking_id, sequence_number)
      );
    `);

        // ==================== BOOKING STATUS HISTORY ====================
        await pool.query(`
  CREATE TABLE IF NOT EXISTS booking_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    status booking_status NOT NULL,
    status_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`);

        // ==================== PAYMENTS ====================
await pool.query(`
CREATE TABLE IF NOT EXISTS paymongo_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  paymongo_payment_intent_id VARCHAR(255) UNIQUE NOT NULL,
  paymongo_checkout_session_id VARCHAR(255) UNIQUE,
  amount NUMERIC(12,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'PHP',
  status paymongo_status DEFAULT 'PENDING',
  payment_method VARCHAR(50) DEFAULT 'GCASH',
  reference_number VARCHAR(100),
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`);
// ==================== NOTIFICATIONS ======================
await pool.query(`
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`);

// ==================== INDEXES ====================
await pool.query(`
  CREATE INDEX IF NOT EXISTS idx_containers_is_returned ON containers(is_returned);
  CREATE INDEX IF NOT EXISTS idx_containers_shipping_line_returned ON containers(shipping_line_id, is_returned);
  CREATE INDEX IF NOT EXISTS idx_booking_containers_booking_id ON booking_containers(booking_id);
  CREATE INDEX IF NOT EXISTS idx_booking_containers_container_id ON booking_containers(container_id);
  CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
  CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
  CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_paymongo_booking_id ON paymongo_payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_paymongo_status ON paymongo_payments(status);
CREATE INDEX IF NOT EXISTS idx_paymongo_method ON paymongo_payments(payment_method);
`);

// ==================== VIEWS ====================
await pool.query(`
  DROP VIEW IF EXISTS booking_summary;
  
  CREATE OR REPLACE VIEW booking_summary AS
  SELECT
    b.id,
    b.booking_number,
    b.hwb_number,
    b.status,
    b.payment_status,
    b.quantity,
    b.booking_mode,
    b.commodity,
    b.origin_port,
    b.destination_port,
    b.shipping_line_id,
    b.ship_id,
    b.created_at,
    b.updated_at,
    
    -- User info
    u.email AS created_by,
    ud.first_name,
    ud.last_name,
    
    -- Shipper details
    sd.company_name AS shipper,
    sd.first_name AS shipper_first_name,
    sd.last_name AS shipper_last_name,
    sd.phone AS shipper_phone,
    
    -- Consignee details
    cd.company_name AS consignee,
    cd.contact_name AS consignee_name,
    cd.phone AS consignee_phone,
    
    -- Addresses
    (pa.city || ', ' || pa.province) AS pickup_location,
    (da.city || ', ' || da.province) AS delivery_location,
    pa.province AS pickup_province,
    pa.city AS pickup_city,
    pa.barangay AS pickup_barangay,
    pa.street AS pickup_street,
    da.province AS delivery_province,
    da.city AS delivery_city,
    da.barangay AS delivery_barangay,
    da.street AS delivery_street,
    
    -- Shipping line info
    sl.name AS shipping_line_name,
    sl.logo_url AS shipping_line_logo,
    
    -- Ship info
    s.vessel_number AS ship_vessel_number,
    s.ship_name,
    
    -- Trucking info
    pt.name AS pickup_trucker,
    pt.id AS pickup_trucker_id,
    ptrk.name AS pickup_truck_name,
    ptrk.id AS pickup_truck_id,
    dt.name AS delivery_trucker,
    dt.id AS delivery_trucker_id,
    dtrk.name AS delivery_truck_name,
    dtrk.id AS delivery_truck_id,
    
    -- Container aggregated info
    COUNT(DISTINCT c.id) AS container_count,
    STRING_AGG(DISTINCT c.van_number, ', ' ORDER BY c.van_number) AS container_vans,
    
    -- Aggregate containers as JSON array with full details
    COALESCE(
      JSON_AGG(
        DISTINCT JSONB_BUILD_OBJECT(
          'id', c.id,
          'van_number', c.van_number,
          'size', c.size,
          'is_returned', c.is_returned,
          'returned_date', c.returned_date,
          'shipping_line_id', c.shipping_line_id
        )
        ORDER BY c.van_number
      ) FILTER (WHERE c.id IS NOT NULL),
      '[]'::json
    ) AS containers

  FROM bookings b
  LEFT JOIN users u ON b.user_id = u.id
  LEFT JOIN user_details ud ON u.id = ud.user_id
  LEFT JOIN booking_shipper_details sd ON sd.booking_id = b.id
  LEFT JOIN booking_consignee_details cd ON cd.booking_id = b.id
  LEFT JOIN booking_pickup_addresses pa ON pa.booking_id = b.id
  LEFT JOIN booking_delivery_addresses da ON da.booking_id = b.id
  LEFT JOIN booking_containers bc ON bc.booking_id = b.id
  LEFT JOIN containers c ON bc.container_id = c.id
  LEFT JOIN shipping_lines sl ON b.shipping_line_id = sl.id
  LEFT JOIN ships s ON b.ship_id = s.id
  LEFT JOIN booking_truck_assignments bta ON b.id = bta.booking_id
  LEFT JOIN trucking_companies pt ON bta.pickup_trucker_id = pt.id
  LEFT JOIN trucks ptrk ON bta.pickup_truck_id = ptrk.id
  LEFT JOIN trucking_companies dt ON bta.delivery_trucker_id = dt.id
  LEFT JOIN trucks dtrk ON bta.delivery_truck_id = dtrk.id

  GROUP BY
    b.id, b.booking_number, b.hwb_number, b.status, b.payment_status,
    b.quantity, b.booking_mode, b.commodity, b.origin_port, b.destination_port,
    b.shipping_line_id, b.ship_id, b.created_at, b.updated_at,
    u.email, ud.first_name, ud.last_name,
    sd.company_name, sd.first_name, sd.last_name, sd.phone,
    cd.company_name, cd.contact_name, cd.phone,
    pa.city, pa.province, pa.barangay, pa.street,
    da.city, da.province, da.barangay, da.street,
    sl.name, sl.logo_url,
    s.vessel_number, s.ship_name,
    pt.name, pt.id, ptrk.name, ptrk.id,
    dt.name, dt.id, dtrk.name, dtrk.id;
`);



        // ==================== TRIGGERS ====================
        const tablesForTrigger = [
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
        VALUES ('gm@gmail.com', $1, 'general_manager')
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