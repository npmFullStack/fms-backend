import { pool } from "../db/index.js";

export const findUserByEmail = async email => {
    return await pool.query("SELECT * FROM users WHERE email = $1", [email]);
};

export const createUser = async (id, username, email, hashedPassword) => {
    return await pool.query(
        "INSERT INTO users (id, username, email, password) VALUES ($1, $2, $3, $4)",
        [id, username, email, hashedPassword]
    );
};

export const findUserById = async id => {
    return await pool.query(
        "SELECT id, username, email FROM users WHERE id = $1",
        [id]
    );
};
