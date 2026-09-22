const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { success, error } = require('../utils/apiResponse');

/**
 * POST /api/auth/login
 * Single-admin password auth returning a JWT.
 */
const login = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return error(res, errors.array()[0].msg, 'VALIDATION_ERROR', 422);
  }

  const { password } = req.body;

  if (password !== process.env.ADMIN_PASSWORD) {
    return error(res, 'Incorrect password.', 'INVALID_CREDENTIALS', 401);
  }

  const token = jwt.sign(
    { role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return success(res, { token, expiresIn: '7d' }, 'Login successful.');
};

/**
 * POST /api/auth/verify
 * Check if a token is still valid.
 */
const verify = (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'No token provided.', 'MISSING_TOKEN', 401);
  }

  try {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET);
    return success(res, { valid: true }, 'Token is valid.');
  } catch {
    return error(res, 'Token is invalid or expired.', 'INVALID_TOKEN', 401);
  }
};

module.exports = { login, verify };
