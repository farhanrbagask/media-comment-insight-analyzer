/**
 * Global error handler middleware.
 * Catches all errors passed via next(err).
 */
const errorMiddleware = (err, req, res, _next) => {
  console.error('Unhandled error:', err);

  // Validation error from express-validator
  if (err.type === 'validation') {
    return res.status(422).json({
      success: false,
      message: 'Validation failed.',
      error: { code: 'VALIDATION_ERROR', details: err.details },
    });
  }

  // PostgreSQL constraint violations
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry — this record already exists.',
      error: { code: 'DUPLICATE_ENTRY' },
    });
  }

  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Referenced resource does not exist.',
      error: { code: 'FOREIGN_KEY_VIOLATION' },
    });
  }

  // Default — never expose raw error details to client
  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: err.message || 'An unexpected error occurred. Please try again.',
    error: { code: err.code || 'INTERNAL_ERROR' },
  });
};

module.exports = { errorMiddleware };
