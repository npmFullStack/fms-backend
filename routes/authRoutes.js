const express = require('express');
const router = express.Router();
const { loginUser, registerUser } = require('../controllers/authController');


router.post('/register', (req, res) => {
  console.log('Register route reached');
  registerUser(req, res);
});

router.post('/login', (req, res) => {
  console.log('Login route reached');
  loginUser(req, res);
});

module.exports = router;