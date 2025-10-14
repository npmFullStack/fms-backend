-- Reset database (drop all tables and types)
DROP VIEW IF EXISTS booking_summary;

-- Drop tables in reverse order to avoid foreign key constraints
DROP TABLE IF EXISTS ap_misc_charges CASCADE;
DROP TABLE IF EXISTS ap_port_charges CASCADE;
DROP TABLE IF EXISTS ap_trucking CASCADE;
DROP TABLE IF EXISTS ap_freight CASCADE;
DROP TABLE IF EXISTS accounts_payable CASCADE;
DROP TABLE IF EXISTS accounts_receivable CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS paymongo_payments CASCADE;
DROP TABLE IF EXISTS booking_status_history CASCADE;
DROP TABLE IF EXISTS booking_containers CASCADE;
DROP TABLE IF EXISTS booking_delivery_addresses CASCADE;
DROP TABLE IF EXISTS booking_pickup_addresses CASCADE;
DROP TABLE IF EXISTS booking_truck_assignments CASCADE;
DROP TABLE IF EXISTS booking_consignee_details CASCADE;
DROP TABLE IF EXISTS booking_shipper_details CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS containers CASCADE;
DROP TABLE IF EXISTS ships CASCADE;
DROP TABLE IF EXISTS shipping_lines CASCADE;
DROP TABLE IF EXISTS trucks CASCADE;
DROP TABLE IF EXISTS trucking_companies CASCADE;
DROP TABLE IF EXISTS password_resets CASCADE;
DROP TABLE IF EXISTS user_details CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop sequences
DROP SEQUENCE IF EXISTS booking_number_seq;
DROP SEQUENCE IF EXISTS hwb_number_seq;

-- Drop custom types
DROP TYPE IF EXISTS paymongo_status CASCADE;
DROP TYPE IF EXISTS booking_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS booking_mode CASCADE;
DROP TYPE IF EXISTS container_type CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;