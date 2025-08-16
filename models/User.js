// models/User.js

import { pool } from "../db/index.js";

// User management: get all users
export const getAllUsers = async () => {
    return await pool.query(`
    SELECT u.id, u.email, u.role, u.is_active, u.created_at,
           ud.first_name, ud.last_name, ud.phone, ud.profile_picture
    FROM users u
    LEFT JOIN user_details ud ON u.id = ud.user_id
    ORDER BY u.created_at DESC
  `);
};

// User management: find by ID
export const findUserById = async id => {
    return await pool.query(
        `
    SELECT u.id, u.email, u.role, u.is_active, u.created_at,
           ud.first_name, ud.last_name, ud.phone, ud.profile_picture
    FROM users u
    LEFT JOIN user_details ud ON u.id = ud.user_id
    WHERE u.id = $1
    `,
        [id]
    );
};

// User management: find by email (for duplicate checking)
export const findUserByEmail = async email => {
    return await pool.query(
        `
    SELECT u.*, ud.first_name, ud.last_name, ud.phone, ud.profile_picture
    FROM users u
    LEFT JOIN user_details ud ON u.id = ud.user_id
    WHERE u.email = $1
    `,
        [email]
    );
};

// User management: create user (admin function)
export const createUser = async (
    id,
    firstName,
    lastName,
    email,
    hashedPassword,
    role = "customer",
    phone = null,
    profile_picture = null
) => {
    await pool.query("BEGIN");
    try {
        await pool.query(
            `INSERT INTO users (id, email, password, role) VALUES ($1, $2, $3, $4)`,
            [id, email, hashedPassword, role]
        );
        await pool.query(
            `INSERT INTO user_details (user_id, first_name, last_name, phone, profile_picture) 
       VALUES ($1, $2, $3, $4, $5)`,
            [id, firstName, lastName, phone, profile_picture]
        );
        await pool.query("COMMIT");
    } catch (error) {
        await pool.query("ROLLBACK");
        throw error;
    }
};

// User management: update user
export const updateUserById = async (
  id,
  firstName,
  lastName,
  email,
  role,
  profilePicture = null,
  phone = null // ✅ add phone
) => {
  await pool.query("BEGIN");
  try {
    await pool.query(
      `UPDATE users SET email = $2, role = $3 WHERE id = $1`,
      [id, email, role]
    );

    await pool.query(
      `UPDATE user_details SET first_name = $2, last_name = $3, profile_picture = $4, phone = $5
       WHERE user_id = $1`,
      [id, firstName, lastName, profilePicture, phone]
    );

    await pool.query("COMMIT");
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }
};

// Restrict (deactivate) a user
export const restrictUserById = async (id) => {
  return await pool.query(
    `UPDATE users SET is_active = FALSE WHERE id = $1 RETURNING *`,
    [id]
  );
};

// Unrestrict (reactivate) a user
export const unrestrictUserById = async (id) => {
  return await pool.query(
    `UPDATE users SET is_active = TRUE WHERE id = $1 RETURNING *`,
    [id]
  );
};


