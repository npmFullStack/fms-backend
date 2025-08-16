import { pool } from "../db/index.js";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

dotenv.config();

async function createTables() {
    try {
        // 1. Create extension
        await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

        // 2. Create enums
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
                    CREATE TYPE booking_mode AS ENUM ('DOOR_TO_DOOR', 'PIER_TO_PIER');
                END IF;

                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
                    CREATE TYPE payment_status AS ENUM ('PENDING', 'PAID', 'OVERDUE');
                END IF;
            END $$;
        `);

        // 3. Create update trigger function
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
        // 4. User tables (unchanged)
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

// ==================== ROUTES TABLE ====================
await pool.query(`
    CREATE TABLE IF NOT EXISTS routes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        origin VARCHAR(100) NOT NULL,
        destination VARCHAR(100) NOT NULL,
        UNIQUE(origin, destination)
    )
`);

// ==================== PARTNER TABLES ====================
// 5. Shipping partners
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
    CREATE TABLE IF NOT EXISTS shipping_line_details (
        shipping_line_id UUID PRIMARY KEY REFERENCES shipping_lines(id) ON DELETE CASCADE,
        logo_url TEXT,
        contact_email VARCHAR(100),
        contact_phone VARCHAR(20),
        website VARCHAR(255),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
`);

// 6. Trucking partners
await pool.query(`
    CREATE TABLE IF NOT EXISTS trucking_companies (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
`);

await pool.query(`
    CREATE TABLE IF NOT EXISTS trucking_company_details (
        trucking_company_id UUID PRIMARY KEY REFERENCES trucking_companies(id) ON DELETE CASCADE,
        logo_url TEXT,
        contact_email VARCHAR(100),
        contact_phone VARCHAR(20),
        service_routes TEXT[],
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
`);

// ==================== PRICING TABLES ====================
// 7. Shipping pricing (now with route_id)
await pool.query(`
    CREATE TABLE IF NOT EXISTS container_pricing (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        shipping_line_id UUID REFERENCES shipping_lines(id) ON DELETE CASCADE,
        route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
        container_type container_type NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
        valid_to DATE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(shipping_line_id, route_id, container_type, valid_from)
    )
`);

// 8. Trucking pricing (also uses route_id now)
await pool.query(`
    CREATE TABLE IF NOT EXISTS trucking_rates (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        trucking_company_id UUID REFERENCES trucking_companies(id) ON DELETE CASCADE,
        route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
        rate DECIMAL(10,2) NOT NULL,
        valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
        valid_to DATE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(trucking_company_id, route_id, valid_from)
    )
`);


        // ==================== SALES/BOOKING TABLES ====================
        // 9. Bookings (sales)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS bookings (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                hwb_number VARCHAR(50) UNIQUE NOT NULL,
                customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
                marketing_coordinator_id UUID REFERENCES users(id),
                mode booking_mode NOT NULL,
                container_type container_type NOT NULL,
                status VARCHAR(50) DEFAULT 'PENDING',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS booking_details (
                booking_id UUID PRIMARY KEY REFERENCES bookings(id) ON DELETE CASCADE,
                shipping_line_id UUID REFERENCES shipping_lines(id),
                trucking_company_id UUID REFERENCES trucking_companies(id),
                van_number VARCHAR(50),
                seal_number VARCHAR(50),
                pickup_address TEXT,
                delivery_address TEXT,
                notes TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);

        // ==================== FINANCIAL TABLES ====================
        // 10. Sales transactions
        await pool.query(`
            CREATE TABLE IF NOT EXISTS sales (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
                quoted_price DECIMAL(10,2) NOT NULL,
                final_price DECIMAL(10,2) NOT NULL,
                payment_status payment_status DEFAULT 'PENDING',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);

        await pool.query(`
    CREATE TABLE IF NOT EXISTS sale_costs (
        sale_id UUID PRIMARY KEY REFERENCES sales(id) ON DELETE CASCADE,
        final_price DECIMAL(10,2) NOT NULL, -- Added here so generated columns work
        shipping_cost DECIMAL(10,2) NOT NULL,
        trucking_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
        other_costs DECIMAL(10,2) DEFAULT 0,
        profit DECIMAL(10,2) GENERATED ALWAYS AS (
            final_price - shipping_cost - trucking_cost - other_costs
        ) STORED,
        margin DECIMAL(5,2) GENERATED ALWAYS AS (
            (final_price - shipping_cost - trucking_cost - other_costs) / final_price * 100
        ) STORED,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
`);


        // 11. Payment tracking
        await pool.query(`
            CREATE TABLE IF NOT EXISTS payments (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
                amount DECIMAL(10,2) NOT NULL,
                payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                reference_number VARCHAR(100),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);

        // ==================== OPERATIONAL TABLES ====================
        // 12. Cargo tracking
        await pool.query(`
            CREATE TABLE IF NOT EXISTS cargo_monitoring (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
                atd TIMESTAMPTZ,
                ata TIMESTAMPTZ,
                delivery_date TIMESTAMPTZ,
                status VARCHAR(50) DEFAULT 'IN_TRANSIT',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);

        // 13. Incident reports
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
            )
        `);

        // ==================== TRIGGERS ====================
        const tables = [
            "users",
            "user_details",
            "shipping_lines",
            "shipping_line_details",
            "trucking_companies",
            "trucking_company_details",
            "container_pricing",
            "trucking_rates",
            "bookings",
            "booking_details",
            "sales",
            "sale_costs",
            "payments",
            "cargo_monitoring",
            "incident_reports"
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
            ON CONFLICT (user_id) DO NOTHING`,
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

