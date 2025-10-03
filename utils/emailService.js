import nodemailer from "nodemailer";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Test transporter connection
transporter.verify(function (error, success) {
    if (error) {
        console.log("Email service error:", error);
    } else {
        console.log("Email service ready");
    }
});

export const sendPasswordResetEmail = async (to, token) => {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

    const mailOptions = {
        from: `"FMS Support" <${process.env.EMAIL_USER}>`,
        to,
        subject: "Password Reset Request",
        html: `
            <p>You requested a password reset.</p>
            <p>Click the link below to reset your password (valid for 15 minutes).</p>
            <a href="${resetUrl}">${resetUrl}</a>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log("Password reset email sent to:", to);
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
};