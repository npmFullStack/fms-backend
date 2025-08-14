import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();
const app = express();

// Configure CORS properly
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://fms-azure.vercel.app"
    ],
    credentials: true
  })
);

app.use(express.json());

// Separate route handlers
app.use("/auth", authRoutes);
app.use("/users", userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));