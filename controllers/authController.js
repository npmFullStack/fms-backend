import { registerSchema, loginSchema } from "../schemas/authSchema.js";
import { v4 as uuidv4 } from "uuid";
import Auth from "../models/Auth.js";
import PasswordReset from "../models/PasswordReset.js";
import { hashPassword, comparePassword } from "../utils/passwordUtils.js";
import { generateToken } from "../utils/jwtGenerator.js";
import { sendPasswordResetEmail } from "../utils/emailService.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";

// Handle user registration with validation
export const registerUser = async (req, res) => {
    try {
        registerSchema.parse(req.body);
        const { firstName, lastName, email, password } = req.body;

        const existing = await Auth.findByEmail(email);
        if (existing.rows.length > 0) {
            return res.status(400).json({ message: "Email already registered" });
        }

        const hashedPassword = await hashPassword(password);
        const userId = uuidv4();

        await Auth.createUser(userId, firstName, lastName, email, hashedPassword);
        res.json({ message: "User registered successfully" });
    } catch (error) {
        if (error.errors) {
            return res.status(400).json({ message: error.errors[0].message });
        }
        res.status(500).json({ message: "Server error" });
    }
};

// Handle user login authentication
export const loginUser = async (req, res) => {
    try {
        loginSchema.parse(req.body);
        const { email, password } = req.body;

        const user = await Auth.findByEmail(email);
        if (user.rows.length === 0) {
            return res.status(400).json({ message: "User not found" });
        }

        if (!user.rows[0].is_active) {
            return res.status(403).json({ message: "Account is restricted. Contact admin." });
        }

        const validPass = await comparePassword(password, user.rows[0].password);
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

// Get current user's profile information
export const getProfile = async (req, res) => {
    try {
        const user = await Auth.findById(req.user.id);
        if (!user.rows.length) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({ user: user.rows[0] });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

// Update user's profile picture
export const uploadProfilePicture = async (req, res) => {
    try {
        const { imageUrl } = req.body;
        await Auth.updateProfilePicture(req.user.id, imageUrl);
        const user = await Auth.findById(req.user.id);
        res.json({ user: user.rows[0] });
    } catch (error) {
        res.status(500).json({ message: "Error updating profile picture" });
    }
};

// Handle password reset request
export const forgotPasswordController = async (req, res) => {
    try {
        const { email } = req.body;

        const userRes = await Auth.findByEmail(email);
        if (userRes.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        const user = userRes.rows[0];

        // Generate random token
        const token = crypto.randomBytes(32).toString("hex");
        const hashedToken = await bcrypt.hash(token, 10);
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min expiry

        // Save reset entry using PasswordReset class
        await PasswordReset.create(user.id, hashedToken, expiresAt);

        // Send email
        await sendPasswordResetEmail(email, token);

        res.json({ message: "Password reset link sent to email" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// Process password reset with token
export const resetPasswordController = async (req, res) => {
    try {
        const { token, password } = req.body;

        // Find valid reset using PasswordReset class
        const resetResult = await PasswordReset.findValid(token);
        
        let validReset = null;
        for (let row of resetResult.rows) {
            const isMatch = await bcrypt.compare(token, row.token);
            if (isMatch) {
                validReset = row;
                break;
            }
        }

        if (!validReset) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        // Hash new password
        const newHashedPassword = await hashPassword(password);

        // Update user password using Auth class
        await Auth.changePassword(validReset.user_id, newHashedPassword);

        // Mark reset as used using PasswordReset class
        await PasswordReset.markUsed(validReset.id);

        res.json({ message: "Password reset successful" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};