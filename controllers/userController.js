// controllers/userController.js
import {
    uploadToCloudinary,
    deleteFromCloudinary,
    getPublicId
} from "../utils/imageUtils.js";
import { v4 as uuidv4 } from "uuid";
import {
    getAllUsers,
    findUserById,
    findUserByEmail,
    createUser,
    updateUserById
} from "../models/User.js";
import { addUserSchema } from "../schemas/userSchema.js";
import { hashPassword, comparePassword } from "../utils/passwordUtils.js";

export const addUser = async (req, res) => {
    let profilePictureUrl = null;
    let publicId = null;

    try {
        // Handle image upload to Cloudinary
        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer);
            profilePictureUrl = result.secure_url;
            publicId = result.public_id;
        }

        // Parse form data
        const userData = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            password: req.body.password,
            role: req.body.role,
            phone: req.body.phone || null,
            profile_picture: profilePictureUrl
        };

        // Validate the data
        addUserSchema.parse(userData);

        const existing = await findUserByEmail(userData.email);
        if (existing.rows.length > 0) {
            if (publicId) {
                await deleteFromCloudinary(publicId);
            }
            return res.status(400).json({ message: "Email already exists" });
        }

        const hashedPassword = await hashPassword(userData.password);
        const userId = uuidv4();

        await createUser(
            userId,
            userData.firstName,
            userData.lastName,
            userData.email,
            hashedPassword,
            userData.role,
            userData.phone,
            userData.profile_picture
        );

        res.json({ message: "User created successfully" });
    } catch (error) {
        // Clean up uploaded image if there's an error
        if (publicId) {
            await deleteFromCloudinary(publicId);
        }

        if (error.errors) {
            return res.status(400).json({ message: error.errors[0].message });
        }
        console.error("Error adding user:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const updateUser = async (req, res) => {
    let profilePictureUrl = null;
    let publicId = null;

    try {
        const { id } = req.params;
        const currentUser = await findUserById(id);

        if (!currentUser.rows.length) {
            return res.status(404).json({ message: "User not found" });
        }

        const currentPublicId = getPublicId(
            currentUser.rows[0].profile_picture
        );

        // Handle new image upload
        if (req.file) {
            // Upload new image
            const result = await uploadToCloudinary(req.file.buffer);
            profilePictureUrl = result.secure_url;
            publicId = result.public_id;

            // Delete old image
            if (currentPublicId) {
                await deleteFromCloudinary(currentPublicId);
            }
        } else {
            // Keep existing image
            profilePictureUrl = currentUser.rows[0].profile_picture;
        }

        const { first_name, last_name, email, role } = req.body;

        await updateUserById(
            id,
            first_name,
            last_name,
            email,
            role,
            profilePictureUrl
        );

        res.json({ message: "User updated successfully" });
    } catch (error) {
        // Clean up uploaded image if there's an error
        if (publicId) {
            await deleteFromCloudinary(publicId);
        }
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await findUserById(id);

        if (!user.rows.length) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user.rows[0]);
    } catch (error) {
        console.error("Error getting user:", error);
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
