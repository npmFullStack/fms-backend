import { pool } from "../db/index.js";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

dotenv.config();

async function createTables() {
    try {
        await pool.query(`
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

            -- User Roles Enum
            CREATE TYPE user_role AS ENUM (
                'customer',
                'marketing_coordinator',
                'admin_finance',
                'general_manager'
            );

            -- Container Types Enum
            CREATE TYPE container_type AS ENUM (
                'LCL',
                '20FT',
                '40FT'
            );

            -- Users Table
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                first_name VARCHAR(50) NOT NULL,
                last_name VARCHAR(50) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role user_role DEFAULT 'customer',
                phone VARCHAR(20),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            -- Shipping Lines Table (simplified)
            CREATE TABLE IF NOT EXISTS shipping_lines (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(100) NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            -- Container Pricing Table
            CREATE TABLE IF NOT EXISTS container_pricing (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                shipping_line_id UUID REFERENCES shipping_lines(id) ON DELETE CASCADE,
                container_type container_type NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE(shipping_line_id, container_type)
            );

            -- Trucking Companies Table (simplified)
            CREATE TABLE IF NOT EXISTS trucking_companies (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(100) NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            -- Update Trigger Function
            CREATE OR REPLACE FUNCTION update_updated_at()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            -- Create Triggers for all tables with updated_at
            CREATE TRIGGER trigger_update_updated_at_users
            BEFORE UPDATE ON users
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at();

            CREATE TRIGGER trigger_update_updated_at_shipping_lines
            BEFORE UPDATE ON shipping_lines
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at();

            CREATE TRIGGER trigger_update_updated_at_container_pricing
            BEFORE UPDATE ON container_pricing
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at();

            CREATE TRIGGER trigger_update_updated_at_trucking_companies
            BEFORE UPDATE ON trucking_companies
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at();
        `);

        // Create default admin account
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await pool.query(`
            INSERT INTO users (first_name, last_name, email, password, role)
            VALUES ('Admin', 'User', 'admin@gmail.com', $1, 'general_manager')
            ON CONFLICT (email) DO NOTHING
        `, [hashedPassword]);

        console.log("Tables created successfully with default admin account");
        process.exit(0);
    } catch (error) {
        console.error("Error creating tables:", error);
        process.exit(1);
    }
}

createTables();