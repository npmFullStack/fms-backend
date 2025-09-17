// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import shippingLineRoutes from "./routes/shippingLineRoutes.js";
import truckingCompanyRoutes from "./routes/truckingCompanyRoutes.js";
import shipRoutes from "./routes/shipRoutes.js";
import containerRoutes from "./routes/containerRoutes.js";
import truckRoutes from "./routes/truckRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";

dotenv.config();

const app = express();

// Configure CORS
app.use(
    cors({
        origin: ["http://localhost:3000", "https://fms-azure.vercel.app"],
        credentials: true
    })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/shipping-lines", shippingLineRoutes);
app.use("/trucking-companies", truckingCompanyRoutes);
app.use("/ships", shipRoutes);
app.use("/containers", containerRoutes);
app.use("/trucks", truckRoutes);
app.use("/bookings", bookingRoutes);

// Simple health check
app.get("/health", (req, res) => {
    res.status(200).json({ status: "OK" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));