import { pool } from "../db/index.js";

class Auth {
  // Find user by email for authentication purposes (login/register)
  static async findByEmail(email) {
    return await pool.query(
      `
      SELECT u.*, ud.first_name, ud.last_name, ud.phone, ud.profile_picture
      FROM users u
      LEFT JOIN user_details ud ON u.id = ud.user_id
      WHERE u.email = $1
      `,
      [email]
    );
  }

  // Create new user account
  static async createUser(id, firstName, lastName, email, hashedPassword, role = "customer") {
    await pool.query(
      `INSERT INTO users (id, email, password, role) VALUES ($1, $2, $3, $4)`,
      [id, email, hashedPassword, role]
    );
    await pool.query(
      `INSERT INTO user_details (user_id, first_name, last_name)
       VALUES ($1, $2, $3)`,
      [id, firstName, lastName]
    );
  }

  // Find user by ID for profile retrieval
  static async findById(id) {
    return await pool.query(`
      SELECT u.*, ud.first_name, ud.last_name, ud.phone, ud.profile_picture
      FROM users u
      LEFT JOIN user_details ud ON u.id = ud.user_id
      WHERE u.id = $1
    `, [id]);
  }

  // Update user's profile picture URL
  static async updateProfilePicture(userId, imageUrl) {
    return await pool.query(
      `
      INSERT INTO user_details (user_id, profile_picture)
      VALUES ($1, $2)
      ON CONFLICT (user_id)
      DO UPDATE SET profile_picture = $2
      `,
      [userId, imageUrl]
    );
  }
}

export default Auth;