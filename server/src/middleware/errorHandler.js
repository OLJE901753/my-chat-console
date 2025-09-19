const logger = require('../utils/logger');

// Custom error classes
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = []) {
    super(message, 400);
    this.details = details;
    this.type = 'validation';
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
    this.type = 'not_found';
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, 409);
    this.type = 'conflict';
  }
}

class ServiceUnavailableError extends AppError {
  constructor(service) {
    super(`${service} service is currently unavailable`, 503);
    this.type = 'service_unavailable';
  }
}

// Error response formatter
const formatErrorResponse = (error, req) => {
  const baseResponse = {
    success: false,
    error: error.message,
    timestamp: error.timestamp || new Date().toISOString(),
    path: req.path,
    method: req.method
  };

  // Add additional details for specific error types
  if (error.details) {
    baseResponse.details = error.details;
  }

  if (error.type) {
    baseResponse.type = error.type;
  }

  // Add request ID if available
  if (req.id) {
    baseResponse.requestId = req.id;
  }

  return baseResponse;
};

// Main error handling middleware
const errorHandler = (error, req, res, next) => {
  let statusCode = 500;
  let response = {};

  // Handle known error types
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    response = formatErrorResponse(error, req);
  } else if (error.name === 'ValidationError') {
    // Joi validation errors
    statusCode = 400;
    response = {
      success: false,
      error: 'Validation failed',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      })),
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    };
  } else if (error.name === 'CastError') {
    // MongoDB cast errors
    statusCode = 400;
    response = {
      success: false,
      error: 'Invalid data format',
      details: `Invalid ${error.path}: ${error.value}`,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    };
  } else if (error.code === 'ECONNREFUSED') {
    // Database connection errors
    statusCode = 503;
    response = {
      success: false,
      error: 'Service temporarily unavailable',
      details: 'Database connection failed',
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    };
  } else {
    // Unknown errors
    response = {
      success: false,
      error: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    };

    // Include stack trace in development
    if (process.env.NODE_ENV !== 'production') {
      response.stack = error.stack;
    }
  }

  // Log the error
  if (statusCode >= 500) {
    logger.error('Server error', {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      body: req.body,
      query: req.query,
      params: req.params
    });
  } else {
    logger.warn('Client error', {
      error: error.message,
      statusCode,
      path: req.path,
      method: req.method,
      ip: req.ip
    });
  }

  res.status(statusCode).json(response);
};

// 404 handler
const notFoundHandler = (req, res) => {
  const response = {
    success: false,
    error: 'Route not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  };

  logger.warn('Route not found', {
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  res.status(404).json(response);
};

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Request timeout handler
const timeoutHandler = (timeout = 30000) => {
  return (req, res, next) => {
    req.setTimeout(timeout, () => {
      const error = new AppError('Request timeout', 408);
      next(error);
    });
    next();
  };
};

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
  ServiceUnavailableError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  timeoutHandler
};
