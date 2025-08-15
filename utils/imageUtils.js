// utils/imageUtils.js
import { v2 as cloudinary } from "cloudinary";
import { promisify } from "util";
import stream from "stream";
import dotenv from "dotenv";
dotenv.config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

// Multer configuration remains the same (memory storage)
import multer from "multer";
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed!"), false);
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Upload to Cloudinary
export const uploadToCloudinary = buffer => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "profiles" },
            (error, result) => {
                if (result) {
                    resolve(result);
                } else {
                    reject(error);
                }
            }
        );

        const bufferStream = new stream.PassThrough();
        bufferStream.end(buffer);
        bufferStream.pipe(uploadStream);
    });
};

// Delete from Cloudinary
export const deleteFromCloudinary = async publicId => {
    try {
        if (publicId) {
            await cloudinary.uploader.destroy(publicId);
        }
    } catch (error) {
        console.error("Error deleting image from Cloudinary:", error);
    }
};

// Generate public ID (for deletion later)
export const getPublicId = url => {
    if (!url) return null;
    const matches = url.match(/\/profiles\/([^/]+)\./);
    return matches ? `profiles/${matches[1]}` : null;
};
