const express = require('express');
const router = express.Router();
const { 
    loginUser, 
    registerUser,
    getMe 
} = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', authMiddleware, getMe); // Add this endpoint

module.exports = router;