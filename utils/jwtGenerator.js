import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

/**
 * Generates a signed JWT token.
 * @param {Object} payload - Data to include in the token (e.g., user ID, email).
 * @returns {string} - A signed JWT token valid for 1 hour.
 */
export const generateToken = payload => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
};
