const Joi = require('joi');
const logger = require('../utils/logger');

// Validation schemas
const schemas = {
  droneCommand: Joi.object({
    command: Joi.string().required().valid(
      'takeoff', 'land', 'emergency_stop', 'return_home',
      'move', 'rotate', 'set_speed', 'take_photo', 'start_recording',
      'stop_recording', 'flip'
    ),
    params: Joi.object().optional()
  }),

  mission: Joi.object({
    name: Joi.string().required().min(1).max(100),
    waypoints: Joi.array().items(
      Joi.object({
        id: Joi.string().required(),
        latitude: Joi.number().required().min(-90).max(90),
        longitude: Joi.number().required().min(-180).max(180),
        altitude: Joi.number().required().min(0).max(120),
        action: Joi.string().optional()
      })
    ).min(1).required(),
    status: Joi.string().valid('pending', 'active', 'completed', 'failed', 'paused').optional()
  }),

  aiMission: Joi.object({
    farmId: Joi.string().required().min(1).max(50),
    objectives: Joi.array().items(Joi.string()).min(1).required(),
    flightConfig: Joi.object({
      altitude: Joi.number().min(10).max(120).required(),
      speed: Joi.number().min(1).max(100).required(),
      duration: Joi.number().min(1).max(3600).required()
    }).required()
  }),

  telemetry: Joi.object({
    altitude: Joi.number().min(0).max(120).required(),
    speed: Joi.number().min(0).max(50).required(),
    battery: Joi.number().min(0).max(100).required(),
    temperature: Joi.number().min(-20).max(60).required(),
    position: Joi.object({
      x: Joi.number().required(),
      y: Joi.number().required(),
      z: Joi.number().required()
    }).required(),
    orientation: Joi.object({
      yaw: Joi.number().min(0).max(360).required(),
      pitch: Joi.number().min(-90).max(90).required(),
      roll: Joi.number().min(-90).max(90).required()
    }).required()
  })
};

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { 
      abortEarly: false,
      stripUnknown: true 
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      logger.warn('Validation error', { 
        path: req.path, 
        method: req.method, 
        errors: errorDetails 
      });

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errorDetails
      });
    }

    req.body = value;
    next();
  };
};

// Query parameter validation
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, { 
      abortEarly: false,
      stripUnknown: true 
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      logger.warn('Query validation error', { 
        path: req.path, 
        method: req.method, 
        errors: errorDetails 
      });

      return res.status(400).json({
        success: false,
        error: 'Query validation failed',
        details: errorDetails
      });
    }

    req.query = value;
    next();
  };
};

// Common query schemas
const querySchemas = {
  pagination: Joi.object({
    limit: Joi.number().integer().min(1).max(1000).default(50),
    offset: Joi.number().integer().min(0).default(0),
    sort: Joi.string().valid('asc', 'desc').default('desc'),
    sortBy: Joi.string().optional()
  }),

  dateRange: Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
    limit: Joi.number().integer().min(1).max(1000).default(50)
  })
};

module.exports = {
  validate,
  validateQuery,
  schemas,
  querySchemas
};
