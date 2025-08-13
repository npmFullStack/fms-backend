import { pool } from "../db/index.js";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

dotenv.config();

async function createTables() {
    try {
        // 1. Create extension
        await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

        // 2. Create enums with proper error handling
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
            END $$;
        `);

        await pool.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'container_type') THEN
                    CREATE TYPE container_type AS ENUM ('LCL', '20FT', '40FT');
                END IF;
            END $$;
        `);

        // 3. Create update trigger function FIRST
        await pool.query(`
            CREATE OR REPLACE FUNCTION update_updated_at()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

        // 4. Create tables in proper order (users first since others reference it)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                email VARCHAR(100) UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role user_role DEFAULT 'customer',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
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
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS shipping_lines (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(100) NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS container_pricing (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                shipping_line_id UUID REFERENCES shipping_lines(id) ON DELETE CASCADE,
                container_type container_type NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE(shipping_line_id, container_type)
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS trucking_companies (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(100) NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);

        // 5. Create triggers for all tables with updated_at
        const tables = [
            "users",
            "user_details",
            "shipping_lines",
            "container_pricing",
            "trucking_companies"
        ];

        for (const table of tables) {
            await pool.query(`
                DROP TRIGGER IF EXISTS trigger_update_updated_at_${table} ON ${table};
                CREATE TRIGGER trigger_update_updated_at_${table}
                BEFORE UPDATE ON ${table}
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at()
            `);
        }

        // 6. Create default admin account
        const hashedPassword = await bcrypt.hash("admin123", 10);
        await pool.query(`
            WITH new_user AS (
                INSERT INTO users (email, password, role)
                VALUES ('admin@gmail.com', $1, 'general_manager')
                ON CONFLICT (email) DO NOTHING
                RETURNING id
            )
            INSERT INTO user_details (user_id, first_name, last_name)
            SELECT id, 'Admin', 'User' FROM new_user
            ON CONFLICT (user_id) DO NOTHING
        `, [hashedPassword]);

        console.log("Tables created successfully with default admin account");
        process.exit(0);
    } catch (error) {
        console.error("Error creating tables:", error);
        process.exit(1);
    }
}

createTables();