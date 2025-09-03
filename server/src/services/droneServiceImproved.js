const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../database/init');
const logger = require('../utils/logger');
const { AppError, ValidationError, ServiceUnavailableError } = require('../middleware/errorHandler');

class DroneServiceImproved {
  constructor() {
    this.db = getDatabase();
    this.isConnected = false;
    this.currentMission = null;
    this.telemetryData = [];
    this.commandHistory = [];
    this.initializeDatabase();
  }

  async initialize() {
    try {
      logger.info('Initializing improved drone service...');
      
      // Initialize database tables
      await this.initializeDatabase();
      
      // Load any active missions
      await this.loadActiveMissions();
      
      logger.info('Improved drone service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize drone service:', error);
      throw new ServiceUnavailableError('Drone Service');
    }
  }

  async initializeDatabase() {
    return new Promise((resolve, reject) => {
      const sql = `
        CREATE TABLE IF NOT EXISTS drone_commands (
          id TEXT PRIMARY KEY,
          command TEXT NOT NULL,
          params TEXT,
          status TEXT DEFAULT 'pending',
          result TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          execution_time REAL
        );

        CREATE TABLE IF NOT EXISTS drone_telemetry (
          id TEXT PRIMARY KEY,
          altitude REAL,
          speed REAL,
          battery REAL,
          temperature REAL,
          position_x REAL,
          position_y REAL,
          position_z REAL,
          orientation_yaw REAL,
          orientation_pitch REAL,
          orientation_roll REAL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS drone_media (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          filename TEXT NOT NULL,
          path TEXT NOT NULL,
          size INTEGER,
          metadata TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `;

      this.db.exec(sql, (err) => {
        if (err) {
          logger.error('Failed to initialize drone database:', err);
          reject(err);
        } else {
          logger.info('Drone database initialized successfully');
          resolve();
        }
      });
    });
  }

  async loadActiveMissions() {
    // Implementation for loading active missions
    logger.info('Loading active missions...');
  }

  // Connection management
  async connect() {
    try {
      if (this.isConnected) {
        throw new AppError('Drone is already connected', 409);
      }

      logger.info('Connecting to drone...');
      
      // Simulate connection process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.isConnected = true;
      logger.info('Drone connected successfully');
      
      return {
        success: true,
        message: 'Drone connected successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to connect to drone:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (!this.isConnected) {
        throw new AppError('Drone is not connected', 400);
      }

      logger.info('Disconnecting from drone...');
      
      // Stop any active missions
      if (this.currentMission) {
        await this.stopMission(this.currentMission.id);
      }
      
      // Simulate disconnection process
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.isConnected = false;
      this.currentMission = null;
      
      logger.info('Drone disconnected successfully');
      
      return {
        success: true,
        message: 'Drone disconnected successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to disconnect from drone:', error);
      throw error;
    }
  }

  // Command execution with validation and logging
  async executeCommand(command, params = {}) {
    const commandId = uuidv4();
    const startTime = Date.now();

    try {
      if (!this.isConnected) {
        throw new AppError('Drone is not connected', 400);
      }

      // Validate command
      const validCommands = [
        'takeoff', 'land', 'emergency_stop', 'return_home',
        'move', 'rotate', 'set_speed', 'take_photo', 
        'start_recording', 'stop_recording', 'flip'
      ];

      if (!validCommands.includes(command)) {
        throw new ValidationError('Invalid command', [
          { field: 'command', message: `Command must be one of: ${validCommands.join(', ')}` }
        ]);
      }

      // Log command
      await this.logCommand(commandId, command, params, 'executing');

      logger.info(`Executing drone command: ${command}`, { commandId, params });

      // Simulate command execution
      const result = await this.simulateCommandExecution(command, params);
      
      const executionTime = Date.now() - startTime;

      // Log successful execution
      await this.logCommand(commandId, command, params, 'completed', result, executionTime);

      return {
        success: true,
        commandId,
        command,
        result,
        executionTime,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // Log failed execution
      await this.logCommand(commandId, command, params, 'failed', error.message, executionTime);
      
      logger.error(`Command execution failed: ${command}`, { 
        commandId, 
        error: error.message,
        executionTime 
      });
      
      throw error;
    }
  }

  async simulateCommandExecution(command, params) {
    // Simulate different execution times based on command complexity
    const executionTimes = {
      'takeoff': 2000,
      'land': 1500,
      'emergency_stop': 500,
      'return_home': 3000,
      'move': 1000,
      'rotate': 800,
      'set_speed': 200,
      'take_photo': 1000,
      'start_recording': 500,
      'stop_recording': 500,
      'flip': 1200
    };

    const delay = executionTimes[command] || 1000;
    await new Promise(resolve => setTimeout(resolve, delay));

    // Simulate different results based on command
    switch (command) {
      case 'takeoff':
        return { message: 'Drone taking off', altitude: 10 };
      case 'land':
        return { message: 'Drone landing', altitude: 0 };
      case 'emergency_stop':
        return { message: 'Emergency stop activated', status: 'stopped' };
      case 'return_home':
        return { message: 'Returning to home position', status: 'returning' };
      case 'move':
        return { message: `Moving ${params.direction} ${params.distance}cm` };
      case 'rotate':
        return { message: `Rotating ${params.direction} ${params.degrees}°` };
      case 'set_speed':
        return { message: `Speed set to ${params.speed}%` };
      case 'take_photo':
        return { message: 'Photo captured', filename: `photo_${Date.now()}.jpg` };
      case 'start_recording':
        return { message: 'Recording started', filename: `video_${Date.now()}.mp4` };
      case 'stop_recording':
        return { message: 'Recording stopped' };
      case 'flip':
        return { message: 'Flip executed successfully' };
      default:
        return { message: 'Command executed successfully' };
    }
  }

  async logCommand(commandId, command, params, status, result = null, executionTime = null) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO drone_commands (id, command, params, status, result, execution_time)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      this.db.run(sql, [
        commandId,
        command,
        JSON.stringify(params),
        status,
        result ? JSON.stringify(result) : null,
        executionTime
      ], (err) => {
        if (err) {
          logger.error('Failed to log command:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // Telemetry management
  async saveTelemetry(telemetryData) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO drone_telemetry (
          id, altitude, speed, battery, temperature,
          position_x, position_y, position_z,
          orientation_yaw, orientation_pitch, orientation_roll
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(sql, [
        uuidv4(),
        telemetryData.altitude,
        telemetryData.speed,
        telemetryData.battery,
        telemetryData.temperature,
        telemetryData.position.x,
        telemetryData.position.y,
        telemetryData.position.z,
        telemetryData.orientation.yaw,
        telemetryData.orientation.pitch,
        telemetryData.orientation.roll
      ], (err) => {
        if (err) {
          logger.error('Failed to save telemetry:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async getTelemetryHistory(limit = 100) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM drone_telemetry 
        ORDER BY timestamp DESC 
        LIMIT ?
      `;

      this.db.all(sql, [limit], (err, rows) => {
        if (err) {
          logger.error('Failed to get telemetry history:', err);
          reject(err);
        } else {
          const formattedRows = rows.map(row => ({
            id: row.id,
            altitude: row.altitude,
            speed: row.speed,
            battery: row.battery,
            temperature: row.temperature,
            position: {
              x: row.position_x,
              y: row.position_y,
              z: row.position_z
            },
            orientation: {
              yaw: row.orientation_yaw,
              pitch: row.orientation_pitch,
              roll: row.orientation_roll
            },
            timestamp: row.timestamp
          }));
          resolve(formattedRows);
        }
      });
    });
  }

  async getCommandHistory(limit = 50) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM drone_commands 
        ORDER BY timestamp DESC 
        LIMIT ?
      `;

      this.db.all(sql, [limit], (err, rows) => {
        if (err) {
          logger.error('Failed to get command history:', err);
          reject(err);
        } else {
          const formattedRows = rows.map(row => ({
            id: row.id,
            command: row.command,
            params: row.params ? JSON.parse(row.params) : {},
            status: row.status,
            result: row.result ? JSON.parse(row.result) : null,
            executionTime: row.execution_time,
            timestamp: row.timestamp
          }));
          resolve(formattedRows);
        }
      });
    });
  }

  // Status and health checks
  getStatus() {
    return {
      connected: this.isConnected,
      currentMission: this.currentMission,
      lastUpdate: new Date().toISOString(),
      uptime: process.uptime()
    };
  }

  getHealth() {
    return {
      status: 'healthy',
      services: {
        database: 'connected',
        telemetry: 'active',
        commands: 'active'
      },
      timestamp: new Date().toISOString()
    };
  }
}

// Singleton instance
let droneServiceInstance = null;

const getDroneService = () => {
  if (!droneServiceInstance) {
    droneServiceInstance = new DroneServiceImproved();
  }
  return droneServiceInstance;
};

const initializeDroneService = async () => {
  const service = getDroneService();
  await service.initialize();
  return service;
};

module.exports = {
  DroneServiceImproved,
  getDroneService,
  initializeDroneService
};
