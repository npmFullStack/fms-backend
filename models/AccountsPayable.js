// models/AccountsPayable.js
import { pool } from "../db/index.js";

class AccountsPayable {
  // Get all AP summaries
  static async getAll() {
    const result = await pool.query(`SELECT * FROM ap_summary ORDER BY created_at DESC`);
    return result.rows;
  }

  // Get AP summary by ID
  static async getById(apId) {
    const result = await pool.query(`SELECT * FROM ap_summary WHERE ap_id = $1`, [apId]);
    return result.rows[0];
  }

  // Get AP by booking ID
  static async getByBookingId(bookingId) {
    const result = await pool.query(`SELECT * FROM ap_summary WHERE booking_id = $1`, [bookingId]);
    return result.rows[0];
  }

  // Get AP by booking number
  static async getByBookingNumber(bookingNumber) {
    const result = await pool.query(`SELECT * FROM ap_summary WHERE booking_number = $1`, [bookingNumber]);
    return result.rows[0];
  }

  // Create AP record
  static async create(bookingId) {
    const result = await pool.query(
      `INSERT INTO accounts_payable (booking_id) VALUES ($1) RETURNING *`,
      [bookingId]
    );
    return result.rows[0];
  }

  // ==================== FREIGHT ====================

  static async addFreight(apId, amount, checkDate, voucher) {
    const result = await pool.query(
      `INSERT INTO ap_freight (ap_id, amount, check_date, voucher) VALUES ($1, $2, $3, $4) RETURNING *`,
      [apId, amount, checkDate, voucher]
    );
    return result.rows[0];
  }

  static async updateFreight(freightId, amount, checkDate, voucher) {
    const result = await pool.query(
      `UPDATE ap_freight SET amount=$1, check_date=$2, voucher=$3 WHERE id=$4 RETURNING *`,
      [amount, checkDate, voucher, freightId]
    );
    return result.rows[0];
  }

  // ==================== TRUCKING ====================

  static async addTrucking(apId, type, amount, checkDate, voucher) {
    const result = await pool.query(
      `INSERT INTO ap_trucking (ap_id, type, amount, check_date, voucher) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [apId, type, amount, checkDate, voucher]
    );
    return result.rows[0];
  }

  static async updateTrucking(truckingId, amount, checkDate, voucher) {
    const result = await pool.query(
      `UPDATE ap_trucking SET amount=$1, check_date=$2, voucher=$3 WHERE id=$4 RETURNING *`,
      [amount, checkDate, voucher, truckingId]
    );
    return result.rows[0];
  }

  // ==================== PORT CHARGES ====================

  static async addPortCharge(apId, chargeType, payee, amount, checkDate, voucher) {
    const result = await pool.query(
      `INSERT INTO ap_port_charges (ap_id, charge_type, payee, amount, check_date, voucher) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [apId, chargeType, payee, amount, checkDate, voucher]
    );
    return result.rows[0];
  }

  static async updatePortCharge(portChargeId, payee, amount, checkDate, voucher) {
    const result = await pool.query(
      `UPDATE ap_port_charges SET payee=$1, amount=$2, check_date=$3, voucher=$4 WHERE id=$5 RETURNING *`,
      [payee, amount, checkDate, voucher, portChargeId]
    );
    return result.rows[0];
  }

  // ==================== MISC CHARGES ====================

  static async addMiscCharge(apId, chargeType, payee, amount, checkDate, voucher) {
    const result = await pool.query(
      `INSERT INTO ap_misc_charges (ap_id, charge_type, payee, amount, check_date, voucher) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [apId, chargeType, payee, amount, checkDate, voucher]
    );
    return result.rows[0];
  }

  static async updateMiscCharge(miscChargeId, payee, amount, checkDate, voucher) {
    const result = await pool.query(
      `UPDATE ap_misc_charges SET payee=$1, amount=$2, check_date=$3, voucher=$4 WHERE id=$5 RETURNING *`,
      [payee, amount, checkDate, voucher, miscChargeId]
    );
    return result.rows[0];
  }
}

export default AccountsPayable;