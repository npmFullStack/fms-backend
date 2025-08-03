import { pool } from "../db/index.js";

export const findUserByEmail = async email => {
  return await pool.query("SELECT * FROM users WHERE email = $1", [email]);
};

export const createUser = async (id, firstName, lastName, email, hashedPassword, role = 'customer') => {
  return await pool.query(
    `INSERT INTO users (id, first_name, last_name, email, password, role)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, firstName, lastName, email, hashedPassword, role]
  );
};

export const findUserById = async id => {
  return await pool.query(
    `SELECT id, first_name, last_name, email, role FROM users WHERE id = $1`,
    [id]
  );
};
