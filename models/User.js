import { pool } from "../db/index.js";

class User {
  // Get all users with their details
  static async getAll() {
    const result = await pool.query(`
      SELECT u.id, u.email, u.role, u.is_active, u.created_at,
             ud.first_name, ud.last_name, ud.phone, ud.profile_picture
      FROM users u
      LEFT JOIN user_details ud ON u.id = ud.user_id
      ORDER BY u.created_at DESC
    `);
    return result.rows;
  }

  // Find user by ID with details
  static async findById(id) {
    const result = await pool.query(
      `
      SELECT u.id, u.email, u.role, u.is_active, u.created_at,
             ud.first_name, ud.last_name, ud.phone, ud.profile_picture
      FROM users u
      LEFT JOIN user_details ud ON u.id = ud.user_id
      WHERE u.id = $1
      `,
      [id]
    );
    return result.rows[0];
  }

  // Find user by email with details
  static async findByEmail(email) {
    const result = await pool.query(
      `
      SELECT u.*, ud.first_name, ud.last_name, ud.phone, ud.profile_picture
      FROM users u
      LEFT JOIN user_details ud ON u.id = ud.user_id
      WHERE u.email = $1
      `,
      [email]
    );
    return result.rows[0];
  }

  // Create new user
  static async create(id, firstName, lastName, email, hashedPassword, role = "customer", phone = null, profile_picture = null) {
    await pool.query(
      `INSERT INTO users (id, email, password, role) VALUES ($1, $2, $3, $4)`,
      [id, email, hashedPassword, role]
    );
    await pool.query(
      `INSERT INTO user_details (user_id, first_name, last_name, phone, profile_picture) 
       VALUES ($1, $2, $3, $4, $5)`,
      [id, firstName, lastName, phone, profile_picture]
    );
  }

  // Update user information with COALESCE for partial updates
  static async update(id, userData) {
    await pool.query(
      `UPDATE users 
       SET email = COALESCE($2, email), 
           role = COALESCE($3, role) 
       WHERE id = $1`,
      [id, userData.email, userData.role]
    );
    await pool.query(
      `UPDATE user_details 
       SET first_name = COALESCE($2, first_name), 
           last_name = COALESCE($3, last_name), 
           profile_picture = COALESCE($4, profile_picture), 
           phone = COALESCE($5, phone)
       WHERE user_id = $1`,
      [id, userData.firstName, userData.lastName, userData.profilePicture, userData.phone]
    );
  }

  // Restrict (deactivate) user account
  static async restrict(id) {
    const result = await pool.query(
      `UPDATE users SET is_active = FALSE WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0];
  }

  // Unrestrict (reactivate) user account
  static async unrestrict(id) {
    const result = await pool.query(
      `UPDATE users SET is_active = TRUE WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0];
  }

  // Update user's profile picture only
  static async updateProfilePicture(id, profilePictureUrl) {
    const result = await pool.query(
      `UPDATE user_details SET profile_picture = $1 WHERE user_id = $2 RETURNING *`,
      [profilePictureUrl, id]
    );
    return result.rows[0];
  }
}

export default User;