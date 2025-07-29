import bcrypt from "bcryptjs";

/**
 * Hashes a plain text password.
 * @param {string} password - User's plain password.
 * @returns {Promise<string>} - Hashed password.
 */
export const hashPassword = async password => {
    const salt = 10;
    return await bcrypt.hash(password, salt);
};

/**
 * Compares a plain password to a hashed password.
 * @param {string} inputPassword - Password from login form.
 * @param {string} hashedPassword - Password from database.
 * @returns {Promise<boolean>} - True if match, false otherwise.
 */
export const comparePassword = async (inputPassword, hashedPassword) => {
    return await bcrypt.compare(inputPassword, hashedPassword);
};
