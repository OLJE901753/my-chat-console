import logger from '../utils/logger';
import { EnvironmentConfig } from '../types';

class EnvironmentConfigClass {
  private config: EnvironmentConfig;

  constructor() {
    this.config = this.validateEnvironment();
  }

  private validateEnvironment(): EnvironmentConfig {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check Supabase configuration
    if (!process.env['SUPABASE_URL'] || !process.env['SUPABASE_SERVICE_ROLE_KEY']) {
      warnings.push('Supabase configuration missing - some features will be disabled');
    }

    // Check frontend URL
    if (!process.env['FRONTEND_URL']) {
      warnings.push('FRONTEND_URL not set, using default: http://localhost:8081');
    }

    // Check Node environment
    if (!process.env['NODE_ENV']) {
      warnings.push('NODE_ENV not set, defaulting to development');
      process.env['NODE_ENV'] = 'development';
    }

    // Check port
    if (!process.env['PORT']) {
      warnings.push('PORT not set, defaulting to 3001');
    }

    // Log warnings and errors
    warnings.forEach(warning => logger.warn(`Environment: ${warning}`));
    errors.forEach(error => logger.error(`Environment: ${error}`));

    if (errors.length > 0) {
      throw new Error('Critical environment variables missing');
    }

    logger.info('Environment validation completed', {
      warnings: warnings.length,
      errors: errors.length,
      nodeEnv: process.env['NODE_ENV'],
      port: process.env['PORT'] || 3001
    });

    return {
      nodeEnv: process.env['NODE_ENV'] || 'development',
      port: parseInt(process.env['PORT'] || '3001'),
      frontendUrl: process.env['FRONTEND_URL'] || 'http://localhost:8081',
      supabase: {
        url: process.env['SUPABASE_URL'] || '',
        serviceRoleKey: process.env['SUPABASE_SERVICE_ROLE_KEY'] || '',
        configured: !!(process.env['SUPABASE_URL'] && process.env['SUPABASE_SERVICE_ROLE_KEY'])
      },
      isDevelopment: (process.env['NODE_ENV'] || 'development') === 'development',
      isProduction: process.env['NODE_ENV'] === 'production'
    };
  }

  getConfig(): EnvironmentConfig {
    return this.config;
  }
}

export default new EnvironmentConfigClass();
