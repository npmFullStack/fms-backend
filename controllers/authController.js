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
