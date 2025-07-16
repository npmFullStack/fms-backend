const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const pool = require("../db"); // Assuming you have a db.js with PostgreSQL pool

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
                error: "Please provide email and password" 
            });
        }

        // Find user in PostgreSQL
        const userQuery = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        
        if (userQuery.rows.length === 0) {
            return res.status(400).json({ 
                success: false,
                error: "Invalid credentials" 
            });
        }

        const user = userQuery.rows[0];

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ 
                success: false,
                error: "Invalid credentials" 
            });
        }

        // Create token payload
        const tokenPayload = {
            id: user.id, // PostgreSQL uses 'id' not '_id'
            email: user.email,
            username: user.username
        };

        // Create token
        const token = jwt.sign(
            tokenPayload,
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        // Prepare response data
        const userData = {
            id: user.id,
            email: user.email,
            username: user.username
        };

        res.json({
            success: true,
            token,
            user: userData
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ 
            success: false,
            error: "Server error during login" 
        });
    }
};

const registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({ 
                success: false,
                error: "Please provide all fields" 
            });
        }

        // Check if user exists in PostgreSQL
        const existingUser = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ 
                success: false,
                error: "User already exists" 
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user in PostgreSQL
        const newUser = await pool.query(
            'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *',
            [username, email, hashedPassword]
        );

        const user = newUser.rows[0];

        // Create token payload
        const tokenPayload = {
            id: user.id,
            email: user.email,
            username: user.username
        };

        // Create token
        const token = jwt.sign(
            tokenPayload,
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        // Prepare response data
        const userData = {
            id: user.id,
            email: user.email,
            username: user.username
        };

        res.status(201).json({
            success: true,
            token,
            user: userData
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ 
            success: false,
            error: "Server error during registration" 
        });
    }
};

const getMe = async (req, res) => {
    try {
        // User is already attached to req by authMiddleware
        const userData = {
            id: req.user.id, // PostgreSQL uses 'id'
            email: req.user.email,
            username: req.user.username
        };

        res.json({
            success: true,
            user: userData
        });
    } catch (error) {
        console.error("GetMe error:", error);
        res.status(500).json({ 
            success: false,
            error: "Server error fetching user data" 
        });
    }
};

module.exports = { loginUser, registerUser, getMe };