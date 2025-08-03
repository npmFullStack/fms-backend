import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();

// Configure CORS properly
app.use(cors({
  origin: [
    'http://localhost:3000', // For local development
    'https://your-vercel-app.vercel.app' // Replace with your actual Vercel URL
  ],
  credentials: true
}));

app.use(express.json());
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));