const logger = require('../utils/logger');

// Performance monitoring middleware
const performanceMonitor = (req, res, next) => {
  const startTime = process.hrtime.bigint();
  const startMemory = process.memoryUsage();

  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const endTime = process.hrtime.bigint();
    const endMemory = process.memoryUsage();
    
    const responseTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    const memoryDelta = {
      rss: endMemory.rss - startMemory.rss,
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      heapTotal: endMemory.heapTotal - startMemory.heapTotal,
      external: endMemory.external - startMemory.external
    };

    // Log performance metrics
    const metrics = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime: Math.round(responseTime * 100) / 100,
      memoryDelta: {
        rss: Math.round(memoryDelta.rss / 1024 / 1024 * 100) / 100, // MB
        heapUsed: Math.round(memoryDelta.heapUsed / 1024 / 1024 * 100) / 100, // MB
        heapTotal: Math.round(memoryDelta.heapTotal / 1024 / 1024 * 100) / 100, // MB
        external: Math.round(memoryDelta.external / 1024 / 1024 * 100) / 100 // MB
      },
      timestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent'),
      ip: req.ip
    };

    // Log slow requests (> 1 second)
    if (responseTime > 1000) {
      logger.warn('Slow request detected', metrics);
    } else if (responseTime > 500) {
      logger.info('Moderate response time', metrics);
    } else {
      logger.debug('Request performance', metrics);
    }

    // Add performance headers
    res.setHeader('X-Response-Time', `${responseTime}ms`);
    res.setHeader('X-Memory-Usage', `${Math.round(endMemory.heapUsed / 1024 / 1024)}MB`);

    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Request rate limiting with performance tracking
const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    if (requests.has(key)) {
      const userRequests = requests.get(key).filter(time => time > windowStart);
      requests.set(key, userRequests);
    } else {
      requests.set(key, []);
    }
    
    const userRequests = requests.get(key);
    
    if (userRequests.length >= max) {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        requests: userRequests.length,
        limit: max
      });
      
      return res.status(429).json({
        success: false,
        error: 'Too many requests',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    userRequests.push(now);
    next();
  };
};

// Memory usage monitoring
const memoryMonitor = () => {
  const formatBytes = (bytes) => {
    return Math.round(bytes / 1024 / 1024 * 100) / 100; // MB
  };

  const logMemoryUsage = () => {
    const usage = process.memoryUsage();
    const metrics = {
      rss: formatBytes(usage.rss),
      heapTotal: formatBytes(usage.heapTotal),
      heapUsed: formatBytes(usage.heapUsed),
      external: formatBytes(usage.external),
      arrayBuffers: formatBytes(usage.arrayBuffers),
      timestamp: new Date().toISOString()
    };

    // Log high memory usage
    if (usage.heapUsed > 100 * 1024 * 1024) { // 100MB
      logger.warn('High memory usage detected', metrics);
    } else {
      logger.debug('Memory usage', metrics);
    }
  };

  // Log memory usage every 30 seconds
  setInterval(logMemoryUsage, 30000);
  
  return logMemoryUsage;
};

// CPU usage monitoring
const cpuMonitor = () => {
  let lastUsage = process.cpuUsage();
  let lastTime = Date.now();

  const logCpuUsage = () => {
    const currentUsage = process.cpuUsage(lastUsage);
    const currentTime = Date.now();
    const timeDelta = currentTime - lastTime;
    
    const cpuPercent = (currentUsage.user + currentUsage.system) / (timeDelta * 1000) * 100;
    
    const metrics = {
      cpuPercent: Math.round(cpuPercent * 100) / 100,
      userTime: currentUsage.user / 1000, // microseconds to milliseconds
      systemTime: currentUsage.system / 1000,
      timestamp: new Date().toISOString()
    };

    // Log high CPU usage
    if (cpuPercent > 80) {
      logger.warn('High CPU usage detected', metrics);
    } else if (cpuPercent > 50) {
      logger.info('Moderate CPU usage', metrics);
    } else {
      logger.debug('CPU usage', metrics);
    }

    lastUsage = process.cpuUsage();
    lastTime = currentTime;
  };

  // Log CPU usage every 10 seconds
  setInterval(logCpuUsage, 10000);
  
  return logCpuUsage;
};

// System health check
const healthCheck = (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      external: Math.round(process.memoryUsage().external / 1024 / 1024)
    },
    cpu: process.cpuUsage(),
    version: process.version,
    platform: process.platform,
    arch: process.arch
  };

  // Determine health status based on metrics
  if (health.memory.heapUsed > 200) { // 200MB
    health.status = 'degraded';
    health.warnings = ['High memory usage'];
  }

  if (health.uptime < 60) { // Less than 1 minute
    health.status = 'starting';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
};

// Performance metrics endpoint
const performanceMetrics = (req, res) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    process: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      version: process.version,
      platform: process.platform,
      arch: process.arch
    },
    system: {
      loadavg: require('os').loadavg(),
      totalmem: require('os').totalmem(),
      freemem: require('os').freemem(),
      cpus: require('os').cpus().length
    }
  };

  res.json(metrics);
};

module.exports = {
  performanceMonitor,
  createRateLimiter,
  memoryMonitor,
  cpuMonitor,
  healthCheck,
  performanceMetrics
};
