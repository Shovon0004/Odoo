const AppError = require('../utils/errors');

/**
 * 1st Error Handler: Handles general custom AppError and JWT authentication errors.
 * Note: Duplicate email registration errors are explicitly passed via next(err)
 * to be handled by the 2nd Error Handler!
 */
const customErrorHandler = (err, req, res, next) => {
  // Delegate duplicate email registration error to the 2nd Error Handler
  if (err.message === 'Email address is already registered' || err.name === 'SequelizeUniqueConstraintError' || err.code === '23505') {
    return next(err);
  }

  // Handle general AppErrors in 1st Handler
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      handledBy: 'firstErrorHandler',
    });
  }

  // Handle JWT errors in 1st Handler
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.',
      handledBy: 'firstErrorHandler',
    });
  }

  // Handle JSON parse / body-parser errors
  if (err instanceof SyntaxError && (err.status === 400 || err.statusCode === 400) && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON payload in request body.',
      handledBy: 'firstErrorHandler',
    });
  }

  // ❌ All other errors fall through to the 2nd Error Handler!
  next(err);
};

/**
 * 2nd Error Handler: Explicitly handles duplicate email registration errors
 * and fallback server errors.
 */
const globalFallbackErrorHandler = (err, req, res, next) => {
  // CASE: Handle Duplicate Email on User Registration in 2nd Error Handler
  if (err.message === 'Email address is already registered' || err.name === 'SequelizeUniqueConstraintError' || err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'Email address is already registered 2',
      handledBy: 'secondErrorHandler',
    });
  }

  // Handle Sequelize Validation Errors
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: err.errors ? err.errors.map((e) => e.message).join(', ') : err.message,
      handledBy: 'secondErrorHandler',
    });
  }

  // Fallback for any unhandled 500 server errors
  if (process.env.NODE_ENV !== 'production') {
    console.error('🔥 UNHANDLED SERVER ERROR IN 2ND HANDLER:', err);
  }

  return res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    handledBy: 'secondErrorHandler',
  });
};

module.exports = {
  customErrorHandler,
  globalFallbackErrorHandler,
};
