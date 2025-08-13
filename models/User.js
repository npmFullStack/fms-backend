import { pool } from "../db/index.js";

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

export const createUser = async (
    id,
    firstName,
    lastName,
    email,
    hashedPassword,
    role = "customer"
) => {
    await pool.query("BEGIN");

    try {
        // Create user record
        await pool.query(
            `INSERT INTO users (id, email, password, role) VALUES ($1, $2, $3, $4)`,
            [id, email, hashedPassword, role]
        );

        // Create user details record
        await pool.query(
            `INSERT INTO user_details (user_id, first_name, last_name)
             VALUES ($1, $2, $3)`,
            [id, firstName, lastName]
        );

        await pool.query("COMMIT");
    } catch (error) {
        await pool.query("ROLLBACK");
        throw error;
    }
};

export const findUserById = async id => {
    return await pool.query(
        `
        SELECT u.id, u.email, u.role, 
               ud.first_name, ud.last_name, ud.phone, ud.profile_picture
        FROM users u
        LEFT JOIN user_details ud ON u.id = ud.user_id
        WHERE u.id = $1
    `,
        [id]
    );
};

export const getAllUsers = async () => {
    return await pool.query(`
        SELECT u.id, u.email, u.role, u.is_active, u.created_at,
               ud.first_name, ud.last_name, ud.phone, ud.profile_picture
        FROM users u
        LEFT JOIN user_details ud ON u.id = ud.user_id
    `);
};

export const updateProfilePicture = async (userId, imageUrl) => {
    return await pool.query(
        `
        INSERT INTO user_details (user_id, profile_picture)
        VALUES ($1, $2)
        ON CONFLICT (user_id) 
        DO UPDATE SET profile_picture = $2
    `,
        [userId, imageUrl]
    );
};
