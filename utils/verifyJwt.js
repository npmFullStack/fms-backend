import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

/**
 * Verifies a JWT token and returns the decoded payload.
 * @param {string} token - The JWT token to verify.
 * @returns {Object} - Decoded token if valid.
 * @throws {Error} - If token is invalid or expired.
 */
export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};
