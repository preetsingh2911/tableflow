/**
 * Centralized error handling middleware + AppError class
 */

class AppError extends Error {
  constructor(message, statusCode, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.errors = errors; // For validation errors array

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Wraps async route handlers to catch errors automatically.
 * Usage: router.get('/path', catchAsync(async (req, res) => { ... }))
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * Global error handler — attached as the last middleware in Express.
 */
const globalErrorHandler = (err, req, res, _next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'production') {
    // Production: send clean error
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        ...(err.errors && { errors: err.errors }),
      });
    }

    // Programming or unknown error — don't leak details
    console.error('ERROR 💥:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong',
    });
  }

  // Development: send full error details
  return res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    ...(err.errors && { errors: err.errors }),
    stack: err.stack,
    error: err,
  });
};

module.exports = { AppError, catchAsync, globalErrorHandler };
