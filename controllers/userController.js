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
    updateUserById,
    restrictUserById,
    unrestrictUserById,
    updateUserProfilePicture
} from "../models/User.js";
import { addUserSchema, updateUserSchema } from "../schemas/userSchema.js";
import { hashPassword, comparePassword } from "../utils/passwordUtils.js";

export const addUser = async (req, res) => {
  let publicId = null;

  try {
    const userId = uuidv4();

    // Parse form data (no profile picture yet)
    const userData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email:
        req.body.email ||
        `${req.body.firstName.toLowerCase()}.${req.body.lastName.toLowerCase()}@example.com`,
      password: req.body.password || "password",
      role: req.body.role,
      phone: req.body.phone || null,
      profile_picture: null
    };

    // Validate
    addUserSchema.parse(userData);

    // Check for duplicate email
    const existing = await findUserByEmail(userData.email);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await hashPassword(userData.password);

    // Create user in DB first (no profile picture yet)
    await createUser(
      userId,
      userData.firstName,
      userData.lastName,
      userData.email,
      hashedPassword,
      userData.role,
      userData.phone,
      null
    );

    // Respond immediately ✅
    res.json({
      message: "User created successfully",
      user: { id: userId, ...userData }
    });

    // ---- Handle profile picture upload in background ----
    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer);
        publicId = result.public_id;

        // Update DB with profile picture once uploaded
        await updateUserProfilePicture(userId, result.secure_url);
      } catch (uploadErr) {
        console.error("Cloudinary upload failed:", uploadErr);
      }
    }
  } catch (error) {
    console.error("Error in addUser:", error);

    if (publicId) {
      await deleteFromCloudinary(publicId);
    }

    if (error.errors) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors
      });
    }

    res.status(500).json({ message: "Server error", error: error.message });
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

export const updateUser = async (req, res) => {
    let profilePictureUrl = null;
    let publicId = null;

    try {
        const { id } = req.params;
        const currentUser = await findUserById(id);

        if (!currentUser.rows.length) {
            return res.status(404).json({ message: "User not found" });
        }

        const currentPublicId = getPublicId(currentUser.rows[0].profile_picture);

        // Handle new image upload
        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer);
            profilePictureUrl = result.secure_url;
            publicId = result.public_id;

            // Delete old image if it exists
            if (currentPublicId) {
                await deleteFromCloudinary(currentPublicId);
            }
        } else {
            // Keep existing image
            profilePictureUrl = currentUser.rows[0].profile_picture;
        }

        // Prepare update data
        const updateData = {
            firstName: req.body.first_name || currentUser.rows[0].first_name,
            lastName: req.body.last_name || currentUser.rows[0].last_name,
            email: req.body.email || currentUser.rows[0].email,
            role: req.body.role || currentUser.rows[0].role,
            phone: req.body.phone || currentUser.rows[0].phone || null,
            profile_picture: profilePictureUrl
        };

        // Validate with updateUserSchema
        updateUserSchema.parse(updateData);

        // Update user in database
        await updateUserById(
            id,
            updateData.firstName,
            updateData.lastName,
            updateData.email,
            updateData.role,
            updateData.profile_picture,
            updateData.phone // Added phone to match your schema
        );

        res.json({ 
            message: "User updated successfully",
            user: {
                id,
                ...updateData
            }
        });

    } catch (error) {
        // Clean up uploaded image if there's an error
        if (publicId) {
            await deleteFromCloudinary(publicId);
        }

        console.error("Error updating user:", error);
        
        if (error.errors) {
            return res.status(400).json({
                message: "Validation error",
                errors: error.errors
            });
        }

        res.status(500).json({ 
            message: "Server error",
            error: error.message 
        });
    }
};


export const restrictUser = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await restrictUserById(id);

    if (!result.rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User restricted successfully", user: result.rows[0] });
  } catch (error) {
    console.error("Error restricting user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const unrestrictUser = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await unrestrictUserById(id);

    if (!result.rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User unrestricted successfully", user: result.rows[0] });
  } catch (error) {
    console.error("Error unrestricting user:", error);
    res.status(500).json({ message: "Server error" });
  }
};
