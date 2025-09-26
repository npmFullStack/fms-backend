-- ===========================
-- DROP EXISTING OBJECTS FIRST
-- ===========================

-- Drop triggers
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT event_object_table, trigger_name 
              FROM information_schema.triggers 
              WHERE trigger_name LIKE 'trigger_update_updated_at_%') LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I;', r.trigger_name, r.event_object_table);
    END LOOP;
END $$;

-- Drop tables (in reverse dependency order)
DROP TABLE IF EXISTS booking_containers CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS truck_details CASCADE;
DROP TABLE IF EXISTS trucks CASCADE;
DROP TABLE IF EXISTS trucking_company_details CASCADE;
DROP TABLE IF EXISTS trucking_companies CASCADE;
DROP TABLE IF EXISTS containers CASCADE;
DROP TABLE IF EXISTS ship_details CASCADE;
DROP TABLE IF EXISTS ships CASCADE;
DROP TABLE IF EXISTS shipping_line_details CASCADE;
DROP TABLE IF EXISTS shipping_lines CASCADE;
DROP TABLE IF EXISTS user_details CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop sequences
DROP SEQUENCE IF EXISTS booking_number_seq CASCADE;
DROP SEQUENCE IF EXISTS hwb_number_seq CASCADE;

-- Drop types
DROP TYPE IF EXISTS booking_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS booking_mode CASCADE;
DROP TYPE IF EXISTS container_type CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- ===========================
-- EXTENSIONS
-- ===========================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================
-- ENUM TYPES
-- ===========================
CREATE TYPE user_role AS ENUM ('customer', 'marketing_coordinator', 'admin_finance', 'general_manager');
CREATE TYPE container_type AS ENUM ('LCL', '20FT', '40FT');
CREATE TYPE booking_mode AS ENUM ('DOOR_TO_DOOR', 'PIER_TO_PIER');
CREATE TYPE payment_status AS ENUM ('PENDING', 'PAID', 'OVERDUE');
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

-- ===========================
-- FUNCTIONS
-- ===========================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===========================
-- SEQUENCES
-- ===========================
CREATE SEQUENCE IF NOT EXISTS booking_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS hwb_number_seq START 1;

-- ===========================
-- TABLES
-- ===========================

-- USERS
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(100) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role user_role DEFAULT 'customer',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_details (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    profile_picture TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SHIPPING LINES
CREATE TABLE shipping_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE shipping_line_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipping_line_id UUID NOT NULL REFERENCES shipping_lines(id) ON DELETE CASCADE,
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipping_line_id UUID NOT NULL REFERENCES shipping_lines(id) ON DELETE CASCADE,
    vessel_number VARCHAR(50) NOT NULL,
    ship_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ship_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ship_id UUID NOT NULL UNIQUE REFERENCES ships(id) ON DELETE CASCADE,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE containers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipping_line_id UUID NOT NULL REFERENCES shipping_lines(id) ON DELETE CASCADE,
    size container_type NOT NULL,
    van_number VARCHAR(100) NOT NULL,
    is_returned BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (shipping_line_id, van_number)
);

-- TRUCKING
CREATE TABLE trucking_companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE trucking_company_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trucking_company_id UUID NOT NULL REFERENCES trucking_companies(id) ON DELETE CASCADE,
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE trucks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trucking_company_id UUID NOT NULL REFERENCES trucking_companies(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    plate_number VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (trucking_company_id, name)
);

CREATE TABLE truck_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    truck_id UUID NOT NULL UNIQUE REFERENCES trucks(id) ON DELETE CASCADE,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- BOOKINGS
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    shipper VARCHAR(150) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    
    consignee VARCHAR(150) NOT NULL,
    consignee_name VARCHAR(100),
    consignee_phone VARCHAR(20),
    
    shipping_line_id UUID NOT NULL REFERENCES shipping_lines(id) ON DELETE CASCADE,
    ship_id UUID REFERENCES ships(id) ON DELETE SET NULL,
    quantity INTEGER DEFAULT 1,
    booking_mode booking_mode NOT NULL,
    commodity VARCHAR(200) NOT NULL,
    
    origin_port VARCHAR(100) NOT NULL,
    destination_port VARCHAR(100) NOT NULL,

    pickup_province VARCHAR(255),
    pickup_city VARCHAR(255),
    pickup_barangay VARCHAR(255),
    pickup_street VARCHAR(255),
    
    delivery_province VARCHAR(255),
    delivery_city VARCHAR(255),
    delivery_barangay VARCHAR(255),
    delivery_street VARCHAR(255),

    pickup_trucker_id UUID REFERENCES trucking_companies(id) ON DELETE SET NULL,
    pickup_truck_id UUID REFERENCES trucks(id) ON DELETE SET NULL,
    delivery_trucker_id UUID REFERENCES trucking_companies(id) ON DELETE SET NULL,
    delivery_truck_id UUID REFERENCES trucks(id) ON DELETE SET NULL,

    actual_departure DATE,
    actual_arrival DATE,
    actual_delivery DATE,
    
    status booking_status DEFAULT 'PICKUP_SCHEDULED',
    payment_status payment_status DEFAULT 'PENDING',
    
    booking_number VARCHAR(50) UNIQUE,
    hwb_number VARCHAR(50) UNIQUE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE booking_containers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    container_id UUID NOT NULL REFERENCES containers(id) ON DELETE CASCADE,
    sequence_number INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(booking_id, sequence_number)
);

-- ===========================
-- INDEXES
-- ===========================
CREATE INDEX idx_containers_is_returned ON containers(is_returned);
CREATE INDEX idx_containers_shipping_line_returned ON containers(shipping_line_id, is_returned);
CREATE INDEX idx_booking_containers_booking_id ON booking_containers(booking_id);
CREATE INDEX idx_booking_containers_container_id ON booking_containers(container_id);

-- ===========================
-- TRIGGERS
-- ===========================
CREATE TRIGGER trigger_update_updated_at_users
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_updated_at_user_details
BEFORE UPDATE ON user_details
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_updated_at_shipping_lines
BEFORE UPDATE ON shipping_lines
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_updated_at_shipping_line_details
BEFORE UPDATE ON shipping_line_details
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_updated_at_ships
BEFORE UPDATE ON ships
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_updated_at_ship_details
BEFORE UPDATE ON ship_details
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_updated_at_containers
BEFORE UPDATE ON containers
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_updated_at_trucking_companies
BEFORE UPDATE ON trucking_companies
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_updated_at_trucking_company_details
BEFORE UPDATE ON trucking_company_details
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_updated_at_trucks
BEFORE UPDATE ON trucks
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_updated_at_truck_details
BEFORE UPDATE ON truck_details
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_updated_at_bookings
BEFORE UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_updated_at_booking_containers
BEFORE UPDATE ON booking_containers
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===========================
-- SEED DATA
-- ===========================

INSERT INTO users (email, password, role)
VALUES ('admin@gmail.com', '$2a$10$P/z4lW/t6ZmtJ8jiIiHQY.b.lTRJzcfUDiuD1bVMMdQYUDHJHmAT.', 'general_manager')
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_details (user_id, first_name, last_name)
SELECT id, 'Admin', 'User' FROM users WHERE email = 'admin@gmail.com'
ON CONFLICT (user_id) DO NOTHING;