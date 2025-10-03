import { registerSchema, loginSchema } from "../schemas/authSchema.js";
import { v4 as uuidv4 } from "uuid";
import {
    findUserByEmail,
    createUser,
    findUserById,
    updateProfilePicture
} from "../models/Auth.js";
import { hashPassword, comparePassword } from "../utils/passwordUtils.js";
import { generateToken } from "../utils/jwtGenerator.js";
import {
    createPasswordReset,
    findValidReset,
    markResetUsed
} from "../models/PasswordReset.js";
import { sendPasswordResetEmail } from "../utils/emailService.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { pool } from "../db/index.js";

export const registerUser = async (req, res) => {
    try {
        registerSchema.parse(req.body);
        const { firstName, lastName, email, password } = req.body;

        const existing = await findUserByEmail(email);
        if (existing.rows.length > 0) {
            return res
                .status(400)
                .json({ message: "Email already registered" });
        }

        const hashedPassword = await hashPassword(password);
        const userId = uuidv4();

        await createUser(userId, firstName, lastName, email, hashedPassword);
        res.json({ message: "User registered successfully" });
    } catch (error) {
        if (error.errors) {
            return res.status(400).json({ message: error.errors[0].message });
        }
        res.status(500).json({ message: "Server error" });
    }
};

export const loginUser = async (req, res) => {
    try {
        loginSchema.parse(req.body);
        const { email, password } = req.body;

        const user = await findUserByEmail(email);
        if (user.rows.length === 0) {
            return res.status(400).json({ message: "User not found" });
        }

        if (!user.rows[0].is_active) {
            return res
                .status(403)
                .json({ message: "Account is restricted. Contact admin." });
        }

        const validPass = await comparePassword(
            password,
            user.rows[0].password
        );
        if (!validPass) {
            return res.status(400).json({ message: "Invalid password" });
        }

        const token = generateToken({
            id: user.rows[0].id,
            email: user.rows[0].email
        });

        res.json({ message: "Login successful", token });
    } catch (error) {
        if (error.errors) {
            return res.status(400).json({ message: error.errors[0].message });
        }
        res.status(500).json({ message: "Server error" });
    }
};

export const getProfile = async (req, res) => {
    try {
        const user = await findUserById(req.user.id);
        if (!user.rows.length) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({ user: user.rows[0] });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

export const uploadProfilePicture = async (req, res) => {
    try {
        const { imageUrl } = req.body;
        await updateProfilePicture(req.user.id, imageUrl);
        const user = await findUserById(req.user.id);
        res.json({ user: user.rows[0] });
    } catch (error) {
        res.status(500).json({ message: "Error updating profile picture" });
    }
};

// Forgot Password
export const forgotPasswordController = async (req, res) => {
    try {
        const { email } = req.body;

        const userRes = await findUserByEmail(email);
        if (userRes.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        const user = userRes.rows[0];

        // Generate random token
        const token = crypto.randomBytes(32).toString("hex");
        const hashedToken = await bcrypt.hash(token, 10);
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min expiry

        // Save reset entry
        await createPasswordReset(user.id, hashedToken, expiresAt);

        // Send email
        await sendPasswordResetEmail(email, token);

        res.json({ message: "Password reset link sent to email" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// Reset Password

export const resetPasswordController = async (req, res) => {
    try {
        const { token, password } = req.body;

        // Check all reset requests
        const resets = await pool.query(
            "SELECT * FROM password_resets WHERE used = FALSE AND expires_at > NOW() ORDER BY created_at DESC"
        );

        let validReset = null;
        for (let row of resets.rows) {
            const isMatch = await bcrypt.compare(token, row.token);
            if (isMatch) {
                validReset = row;
                break;
            }
        }

        // FIX: Change 'ValidReset' to 'validReset' (case sensitivity)
        if (!validReset) {
            // Changed from 'ValidReset' to 'validReset'
            return res
                .status(400)
                .json({ message: "Invalid or expired token" });
        }

        // Hash new password
        const newHashedPassword = await hashPassword(password);

        await pool.query("UPDATE users SET password = $1 WHERE id = $2", [
            newHashedPassword,
            validReset.user_id
        ]);

        // Mark reset as used
        await markResetUsed(validReset.id);

        res.json({ message: "Password reset successful" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};
