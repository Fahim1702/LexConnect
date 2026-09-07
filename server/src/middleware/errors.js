import ApiError from '../utils/ApiError.js';

export function notFound(req, _res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(error, _req, res, _next) {
  let statusCode = error.statusCode || error.status || 500;
  let message = error.message || 'Something went wrong.';

  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(error.errors).map((item) => item.message).join(' ');
  }
  if (error.code === 11000) {
    statusCode = 409;
    message = `A record with that ${Object.keys(error.keyPattern || {}).join(', ') || 'value'} already exists.`;
  }
  if (error.name === 'CastError') {
    statusCode = 400;
    message = 'The supplied record ID is invalid.';
  }
  if (error.name === 'VersionError') {
    statusCode = 409;
    message = 'This request changed while you were editing it. Refresh and try again.';
  }
  if (['JsonWebTokenError', 'TokenExpiredError'].includes(error.name)) {
    statusCode = 401;
    message = 'Your session is invalid or has expired.';
  }

  if (error.type === 'entity.parse.failed') message = 'Request body must contain valid JSON.';
  if (statusCode >= 500) message = 'An unexpected server error occurred.';

  res.status(statusCode).json({
    success: false,
    message,
    ...(error.details ? { details: error.details } : {})
  });
}
