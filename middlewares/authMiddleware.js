const jwt = require("jsonwebtoken");

const authMiddleware = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header("Authorization")?.replace("Bearer ", "");
        
        if (!token) {
            return res.status(401).json({ error: "No token, authorization denied" });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Add user from payload to request object
        req.user = decoded;
        
        next();
    } catch (err) {
        console.error("Authentication error:", err);
        res.status(401).json({ error: "Token is not valid" });
    }
};

module.exports = authMiddleware;