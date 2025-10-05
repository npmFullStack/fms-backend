// controllers/userController

import { uploadToCloudinary, deleteFromCloudinary, getPublicId } from "../utils/imageUtils.js";
import { v4 as uuidv4 } from "uuid";
import User from "../models/User.js";
import { addUserSchema, updateUserSchema } from "../schemas/userSchema.js";
import { hashPassword } from "../utils/passwordUtils.js";

// Create new user
export const addUser = async (req, res) => {
  try {
    const userId = uuidv4();
    
    // Get user data from request
    const userData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email || `${req.body.firstName}.${req.body.lastName}@example.com`,
      password: req.body.password || "password",
      role: req.body.role,
      phone: req.body.phone || null
    };

    // Validate data
    addUserSchema.parse(userData);

    // Check if email already exists
    const existing = await User.findByEmail(userData.email);
    if (existing) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await hashPassword(userData.password);

    // Create user without profile picture first
    await User.create(userId, userData.firstName, userData.lastName, userData.email, hashedPassword, userData.role, userData.phone, null);

    // If there's a profile picture, upload it and update user
    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer);
        await User.updateProfilePicture(userId, result.secure_url);
      } catch (uploadErr) {
        console.error("Failed to upload profile picture:", uploadErr);
      }
    }

    res.json({ message: "User created successfully", userId });
  } catch (error) {
    if (error.errors) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// Get single user by ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get all users
export const getUsers = async (req, res) => {
  try {
    const users = await User.getAll();
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Update user information
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const currentUser = await User.findById(id);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    let profilePictureUrl = currentUser.profile_picture;

    // Handle new profile picture upload
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      profilePictureUrl = result.secure_url;

      // Delete old profile picture if exists
      const currentPublicId = getPublicId(currentUser.profile_picture);
      if (currentPublicId) {
        await deleteFromCloudinary(currentPublicId);
      }
    }

    // Prepare update data object (only include provided fields)
    const updateData = {
      firstName: req.body.first_name,
      lastName: req.body.last_name,
      email: req.body.email,
      role: req.body.role,
      phone: req.body.phone,
      profilePicture: profilePictureUrl
    };

    // Validate data
    updateUserSchema.parse(updateData);

    // Update user in database using object
    await User.update(id, updateData);

    res.json({ message: "User updated successfully" });
  } catch (error) {
    if (error.errors) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// Restrict user (deactivate)
export const restrictUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.restrict(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User restricted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Unrestrict user (reactivate)
export const unrestrictUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.unrestrict(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User unrestricted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};