const jwt = require('jsonwebtoken');
const { error } = require('../utils/apiResponse');

/**
 * JWT authentication middleware.
 * Requires Authorization: Bearer <token> header.
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'Authentication required.', 'UNAUTHORIZED', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error(res, 'Session expired. Please log in again.', 'TOKEN_EXPIRED', 401);
    }
    return error(res, 'Invalid authentication token.', 'INVALID_TOKEN', 401);
  }
};

module.exports = { authMiddleware };
