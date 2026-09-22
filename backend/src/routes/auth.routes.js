const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');

// POST /api/auth/login
router.post(
  '/login',
  [
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  authController.login
);

// POST /api/auth/verify — check token validity
router.post('/verify', authController.verify);

module.exports = router;
