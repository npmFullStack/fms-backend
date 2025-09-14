-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom enum types
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

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==================== USERS ====================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(100) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role user_role DEFAULT 'customer',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_details (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    profile_picture TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================== SHIPPING LINES ====================
CREATE TABLE IF NOT EXISTS shipping_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shipping_line_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipping_line_id UUID NOT NULL REFERENCES shipping_lines(id) ON DELETE CASCADE,
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipping_line_id UUID NOT NULL REFERENCES shipping_lines(id) ON DELETE CASCADE,
    vessel_number VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ship_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ship_id UUID NOT NULL UNIQUE REFERENCES ships(id) ON DELETE CASCADE,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS containers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ship_id UUID NOT NULL REFERENCES ships(id) ON DELETE CASCADE,
    size container_type NOT NULL,
    van_number VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (ship_id, van_number)
);

-- ==================== TRUCKING ====================
CREATE TABLE IF NOT EXISTS trucking_companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trucking_company_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trucking_company_id UUID NOT NULL REFERENCES trucking_companies(id) ON DELETE CASCADE,
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trucks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trucking_company_id UUID NOT NULL REFERENCES trucking_companies(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    plate_number VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (trucking_company_id, name)
);

CREATE TABLE IF NOT EXISTS truck_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    truck_id UUID NOT NULL UNIQUE REFERENCES trucks(id) ON DELETE CASCADE,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================== BOOKINGS ====================
CREATE SEQUENCE IF NOT EXISTS booking_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS hwb_number_seq START 1;

CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    booking_date DATE NOT NULL,
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

-- ==================== TRIGGERS ====================
-- Users table trigger
DROP TRIGGER IF EXISTS trigger_update_updated_at_users ON users;
CREATE TRIGGER trigger_update_updated_at_users
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- User details table trigger
DROP TRIGGER IF EXISTS trigger_update_updated_at_user_details ON user_details;
CREATE TRIGGER trigger_update_updated_at_user_details
BEFORE UPDATE ON user_details
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Shipping lines table trigger
DROP TRIGGER IF EXISTS trigger_update_updated_at_shipping_lines ON shipping_lines;
CREATE TRIGGER trigger_update_updated_at_shipping_lines
BEFORE UPDATE ON shipping_lines
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Shipping line details table trigger
DROP TRIGGER IF EXISTS trigger_update_updated_at_shipping_line_details ON shipping_line_details;
CREATE TRIGGER trigger_update_updated_at_shipping_line_details
BEFORE UPDATE ON shipping_line_details
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Ships table trigger
DROP TRIGGER IF EXISTS trigger_update_updated_at_ships ON ships;
CREATE TRIGGER trigger_update_updated_at_ships
BEFORE UPDATE ON ships
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Ship details table trigger
DROP TRIGGER IF EXISTS trigger_update_updated_at_ship_details ON ship_details;
CREATE TRIGGER trigger_update_updated_at_ship_details
BEFORE UPDATE ON ship_details
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Containers table trigger
DROP TRIGGER IF EXISTS trigger_update_updated_at_containers ON containers;
CREATE TRIGGER trigger_update_updated_at_containers
BEFORE UPDATE ON containers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Trucking companies table trigger
DROP TRIGGER IF EXISTS trigger_update_updated_at_trucking_companies ON trucking_companies;
CREATE TRIGGER trigger_update_updated_at_trucking_companies
BEFORE UPDATE ON trucking_companies
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Trucking company details table trigger
DROP TRIGGER IF EXISTS trigger_update_updated_at_trucking_company_details ON trucking_company_details;
CREATE TRIGGER trigger_update_updated_at_trucking_company_details
BEFORE UPDATE ON trucking_company_details
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Trucks table trigger
DROP TRIGGER IF EXISTS trigger_update_updated_at_trucks ON trucks;
CREATE TRIGGER trigger_update_updated_at_trucks
BEFORE UPDATE ON trucks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Truck details table trigger
DROP TRIGGER IF EXISTS trigger_update_updated_at_truck_details ON truck_details;
CREATE TRIGGER trigger_update_updated_at_truck_details
BEFORE UPDATE ON truck_details
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Bookings table trigger
DROP TRIGGER IF EXISTS trigger_update_updated_at_bookings ON bookings;
CREATE TRIGGER trigger_update_updated_at_bookings
BEFORE UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Booking details table trigger
DROP TRIGGER IF EXISTS trigger_update_updated_at_booking_details ON booking_details;
CREATE TRIGGER trigger_update_updated_at_booking_details
BEFORE UPDATE ON booking_details
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- ==================== ADMIN SEED ====================
INSERT INTO users (email, password, role)
VALUES ('admin@gmail.com', '$2a$10$rOzZJN.9p8W9eF5YQkKZv.LqB7nV1mW8cJdK5tR3sS2vX1pY6hHdC', 'general_manager')
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_details (user_id, first_name, last_name)
SELECT id, 'Admin', 'User' FROM users WHERE email = 'admin@gmail.com'
ON CONFLICT (user_id) DO NOTHING;