import { v4 as uuidv4 } from "uuid";
import { addUserSchema } from "../schemas/userSchema.js";
import { 
  getAllUsers, 
  findUserById, 
  findUserByEmail,
  createUser,
  updateUserById 
} from "../models/User.js";
import { hashPassword } from "../utils/passwordUtils.js";

export const addUser = async (req, res) => {
  try {
    addUserSchema.parse(req.body);
    const { first_name, last_name, email, password, role } = req.body;
    
    // Check if user already exists
    const existing = await findUserByEmail(email);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }
    
    const hashedPassword = await hashPassword(password);
    const userId = uuidv4();
    
    await createUser(userId, first_name, last_name, email, hashedPassword, role);
    res.json({ message: "User created successfully" });
  } catch (error) {
    if (error.errors) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    console.error("Error adding user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getUsers = async (req, res) => {
  try {
    const result = await getAllUsers();
    res.json({ rows: result.rows });
  } catch (err) {
    console.error("Error getting users:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await findUserById(id);
    if (!result.rows.length) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, email, role } = req.body;
    
    await updateUserById(id, first_name, last_name, email, role);
    res.json({ message: "User updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error" });
  }
};