const SupabaseService = require('../services/supabaseService');
const logger = require('../utils/logger');

class HealthCheckService {
  constructor() {
    this.supabaseService = new SupabaseService();
  }

  async getDetailedHealth() {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {},
      system: {
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
      }
    };

    // Check Supabase health
    try {
      const supabaseHealthy = await this.supabaseService.checkHealth();
      health.services.supabase = {
        status: supabaseHealthy ? 'healthy' : 'unhealthy',
        configured: !!this.supabaseService.supabase,
        message: supabaseHealthy ? 'Connected' : 'Connection failed'
      };
    } catch (error) {
      health.services.supabase = {
        status: 'error',
        configured: !!this.supabaseService.supabase,
        message: error.message
      };
    }

    // Determine overall health status
    const warnings = [];
    if (health.system.memory.heapUsed > 200) {
      warnings.push('High memory usage');
      health.status = 'degraded';
    }

    if (health.uptime < 60) {
      health.status = 'starting';
    }

    if (health.services.supabase?.status === 'error') {
      warnings.push('Supabase connection issues');
      if (health.status === 'healthy') health.status = 'degraded';
    }

    if (warnings.length > 0) {
      health.warnings = warnings;
    }

    return health;
  }

  async healthCheckEndpoint(req, res) {
    try {
      const health = await this.getDetailedHealth();
      const statusCode = health.status === 'healthy' ? 200 : 
                        health.status === 'degraded' ? 200 : 503;
      
      res.status(statusCode).json(health);
    } catch (error) {
      logger.error('Health check failed:', error);
      res.status(503).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        message: error.message
      });
    }
  }
}

module.exports = new HealthCheckService();
