import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();


export const verifyToken = token => {
    return jwt.verify(token, process.env.JWT_SECRET);
};
