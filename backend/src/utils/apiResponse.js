/**
 * Standard API response helpers — keeps all responses consistent.
 */

/**
 * Send a successful response.
 * @param {object} res        Express response
 * @param {*}      data       Payload data
 * @param {string} message    Human-readable message
 * @param {number} statusCode HTTP status (default 200)
 */
const success = (res, data = null, message = 'Success', statusCode = 200) => {
  const body = { success: true, message };
  if (data !== null) body.data = data;
  return res.status(statusCode).json(body);
};

/**
 * Send an error response.
 * @param {object} res        Express response
 * @param {string} message    Human-readable error message
 * @param {string} code       Machine-readable error code
 * @param {number} statusCode HTTP status (default 400)
 */
const error = (res, message = 'An error occurred', code = 'ERROR', statusCode = 400) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: { code },
  });
};

/**
 * Send a paginated response.
 */
const paginated = (res, data, pagination, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination,
  });
};

module.exports = { success, error, paginated };
