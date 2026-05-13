export class ApiError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;

  console.error('API error:', {
    method: req.method,
    path: req.originalUrl,
    statusCode,
    message: err.message,
  });

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'Error interno del servidor' : err.message,
    details:
      statusCode === 500 && process.env.NODE_ENV !== 'development'
        ? undefined
        : err.details,
  });
}
