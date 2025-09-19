const winston = require('winston');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = ` ${JSON.stringify(meta)}`;
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// Custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: fileFormat,
  defaultMeta: { service: 'drone-control' },
  transports: [
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Combined log file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Drone operations log file
    new winston.transports.File({
      filename: path.join(logsDir, 'drone-operations.log'),
      level: 'info',
      maxsize: 10485760, // 10MB
      maxFiles: 10,
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, command, params, result, ...meta }) => {
          let logEntry = `${timestamp} [${level.toUpperCase()}]: ${message}`;
          if (command) logEntry += ` | Command: ${command}`;
          if (params) logEntry += ` | Params: ${JSON.stringify(params)}`;
          if (result) logEntry += ` | Result: ${JSON.stringify(result)}`;
          return logEntry;
        })
      )
    }),
    
    // Safety events log file
    new winston.transports.File({
      filename: path.join(logsDir, 'safety-events.log'),
      level: 'warn',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, event_type, severity, position, ...meta }) => {
          let logEntry = `${timestamp} [${level.toUpperCase()}] [${event_type || 'UNKNOWN'}] [${severity || 'UNKNOWN'}]: ${message}`;
          if (position) logEntry += ` | Position: ${JSON.stringify(position)}`;
          return logEntry;
        })
      )
    })
  ],
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// Add custom methods for drone operations
logger.droneCommand = (command, params, result) => {
  logger.info('Drone command executed', { command, params, result });
};

logger.droneOperation = (operation, details) => {
  logger.info(`Drone operation: ${operation}`, details);
};

logger.safetyEvent = (eventType, severity, description, position = null) => {
  logger.warn('Safety event detected', { 
    event_type: eventType, 
    severity, 
    description, 
    position 
  });
};

logger.missionUpdate = (missionId, status, details) => {
  logger.info('Mission status update', { 
    mission_id: missionId, 
    status, 
    ...details 
  });
};

logger.telemetryUpdate = (telemetryData) => {
  logger.debug('Telemetry update', telemetryData);
};

// Add error handling for uncaught exceptions
logger.exceptions.handle(
  new winston.transports.File({
    filename: path.join(logsDir, 'exceptions.log'),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  })
);

// Add error handling for unhandled promise rejections
logger.rejections.handle(
  new winston.transports.File({
    filename: path.join(logsDir, 'rejections.log'),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  })
);

module.exports = logger;
