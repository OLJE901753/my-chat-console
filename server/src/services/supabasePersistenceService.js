const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

class SupabasePersistenceService {
  constructor() {
    this.supabase = null;
    this.initialized = false;
    this.init();
  }

  async init() {
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        logger.warn('Supabase credentials not found. Persistence disabled.');
        return;
      }

      this.supabase = createClient(supabaseUrl, supabaseKey);
      
      // Test connection
      const { data, error } = await this.supabase
        .from('users')
        .select('count')
        .limit(1);

      if (error) {
        logger.error('Supabase connection failed:', error);
        return;
      }

      this.initialized = true;
      logger.info('✅ Supabase persistence service initialized');
    } catch (error) {
      logger.error('Failed to initialize Supabase persistence:', error);
    }
  }

  async isReady() {
    return this.initialized && this.supabase !== null;
  }

  // Persist sensor readings
  async persistSensorReading(data) {
    if (!this.isReady()) return false;

    try {
      const { error } = await this.supabase
        .from('sensor_readings')
        .insert({
          id: data.id || require('uuid').v4(),
          sensor_type: data.sensor_type || 'generic',
          location: data.location || 'Unknown',
          data: data,
          timestamp: data.timestamp || new Date().toISOString(),
          created_at: new Date().toISOString()
        });

      if (error) {
        logger.error('Failed to persist sensor reading:', error);
        return false;
      }

      logger.debug('✅ Sensor reading persisted to Supabase');
      return true;
    } catch (error) {
      logger.error('Error persisting sensor reading:', error);
      return false;
    }
  }

  // Persist weather data
  async persistWeatherData(data) {
    if (!this.isReady()) return false;

    try {
      const { error } = await this.supabase
        .from('norwegian_weather_data')
        .insert({
          station_id: data.stationId || 'SN44560',
          temperature: data.temperature,
          humidity: data.humidity,
          wind_speed: data.windSpeed,
          wind_direction: data.windDirection,
          precipitation: data.rain || 0,
          pressure: data.pressure,
          cloud_cover: data.cloudCover || null,
          visibility: data.visibility || null,
          symbol_code: data.symbolCode || null,
          symbol_name: data.symbolName || null,
          source: data.source || 'netatmo',
          timestamp: data.timestamp || new Date().toISOString(),
          created_at: new Date().toISOString()
        });

      if (error) {
        logger.error('Failed to persist weather data:', error);
        return false;
      }

      logger.debug('✅ Weather data persisted to Supabase');
      return true;
    } catch (error) {
      logger.error('Error persisting weather data:', error);
      return false;
    }
  }

  // Persist drone telemetry
  async persistDroneTelemetry(data) {
    if (!this.isReady()) return false;

    try {
      const { error } = await this.supabase
        .from('drone_telemetry')
        .insert({
          id: data.id || require('uuid').v4(),
          drone_id: data.droneId || 'default_drone',
          battery_level: data.battery,
          altitude: data.altitude,
          speed: data.speed,
          temperature: data.temperature,
          position: data.position ? `POINT(${data.position.x} ${data.position.y})` : null,
          orientation: data.orientation || {},
          mission_id: data.missionId || null,
          timestamp: data.timestamp || new Date().toISOString(),
          created_at: new Date().toISOString()
        });

      if (error) {
        logger.error('Failed to persist drone telemetry:', error);
        return false;
      }

      logger.debug('✅ Drone telemetry persisted to Supabase');
      return true;
    } catch (error) {
      logger.error('Error persisting drone telemetry:', error);
      return false;
    }
  }

  // Persist camera events
  async persistCameraEvent(data) {
    if (!this.isReady()) return false;

    try {
      const { error } = await this.supabase
        .from('camera_events')
        .insert({
          id: data.id || require('uuid').v4(),
          camera_id: data.cameraId,
          event_type: data.eventType,
          camera_data: data.camera || {},
          event_data: data.data || {},
          timestamp: data.timestamp || new Date().toISOString(),
          created_at: new Date().toISOString()
        });

      if (error) {
        logger.error('Failed to persist camera event:', error);
        return false;
      }

      logger.debug('✅ Camera event persisted to Supabase');
      return true;
    } catch (error) {
      logger.error('Error persisting camera event:', error);
      return false;
    }
  }

  // Persist agent status
  async persistAgentStatus(data) {
    if (!this.isReady()) return false;

    try {
      const { error } = await this.supabase
        .from('agent_logs')
        .insert({
          id: data.id || require('uuid').v4(),
          agent_id: data.agentId || 'unknown',
          action: data.action || 'status_update',
          details: data.message || 'Status update',
          success: data.success !== false,
          created_at: data.timestamp || new Date().toISOString()
        });

      if (error) {
        logger.error('Failed to persist agent status:', error);
        return false;
      }

      logger.debug('✅ Agent status persisted to Supabase');
      return true;
    } catch (error) {
      logger.error('Error persisting agent status:', error);
      return false;
    }
  }

  // Persist experiment logs
  async persistExperimentLog(experimentId, logData) {
    if (!this.isReady()) return false;

    try {
      const { error } = await this.supabase
        .from('experiment_logs')
        .insert({
          id: logData.id || require('uuid').v4(),
          experiment_id: experimentId,
          user_id: logData.userId || '00000000-0000-0000-0000-000000000000', // Default user
          level: logData.level || 'info',
          message: logData.message,
          payload: logData.payload || {},
          created_at: logData.timestamp || new Date().toISOString()
        });

      if (error) {
        logger.error('Failed to persist experiment log:', error);
        return false;
      }

      logger.debug('✅ Experiment log persisted to Supabase');
      return true;
    } catch (error) {
      logger.error('Error persisting experiment log:', error);
      return false;
    }
  }

  // Get recent data for a specific type
  async getRecentData(table, limit = 100, orderBy = 'created_at') {
    if (!this.isReady()) return [];

    try {
      const { data, error } = await this.supabase
        .from(table)
        .select('*')
        .order(orderBy, { ascending: false })
        .limit(limit);

      if (error) {
        logger.error(`Failed to get recent data from ${table}:`, error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error(`Error getting recent data from ${table}:`, error);
      return [];
    }
  }

  // Get data for a specific time range
  async getDataInRange(table, startTime, endTime, limit = 1000) {
    if (!this.isReady()) return [];

    try {
      const { data, error } = await this.supabase
        .from(table)
        .select('*')
        .gte('timestamp', startTime)
        .lte('timestamp', endTime)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error(`Failed to get data in range from ${table}:`, error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error(`Error getting data in range from ${table}:`, error);
      return [];
    }
  }
}

module.exports = new SupabasePersistenceService();
