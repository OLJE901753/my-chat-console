const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../database/init');
const logger = require('../utils/logger');
const { SupabaseMediaService } = require('./supabaseMediaService');

class DroneService {
  constructor(io) {
    this.io = io;
    this.db = getDatabase();
    this.supabaseMedia = new SupabaseMediaService();
    this.droneStatus = {
      connected: false,
      battery: 0,
      altitude: 0,
      speed: 0,
      temperature: 0,
      position: { x: 0, y: 0, z: 0 },
      orientation: { yaw: 0, pitch: 0, roll: 0 },
      mission: null,
      lastUpdate: null
    };
    
    this.activeMission = null;
    this.telemetryInterval = null;
    this.safetyChecks = {
      geofence: { enabled: true, bounds: { x: [-100, 100], y: [-100, 100], z: [0, 120] } },
      lowBattery: { threshold: 20, enabled: true },
      maxAltitude: { limit: 120, enabled: true }
    };
  }

  // Initialize drone connection
  async initialize() {
    try {
      logger.info('Initializing drone service...');
      
      // In a real implementation, this would connect to the Tello drone
      // For now, we'll simulate the connection
      await this.simulateConnection();
      
      // Start telemetry updates
      this.startTelemetryUpdates();
      
      logger.info('Drone service initialized successfully');
      return { success: true, message: 'Drone service ready' };
    } catch (error) {
      logger.error('Failed to initialize drone service:', error);
      throw error;
    }
  }

  // Simulate drone connection (replace with actual Tello SDK calls)
  async simulateConnection() {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.droneStatus.connected = true;
        this.droneStatus.battery = 85;
        this.droneStatus.altitude = 0;
        this.droneStatus.speed = 0;
        this.droneStatus.temperature = 25;
        this.droneStatus.lastUpdate = new Date();
        resolve();
      }, 2000);
    });
  }

  // Execute drone commands
  async executeCommand(command, params = {}) {
    try {
      logger.info(`Executing drone command: ${command}`, params);
      
      if (!this.droneStatus.connected) {
        throw new Error('Drone not connected');
      }

      let result;
      switch (command) {
        case 'takeoff':
          result = await this.takeoff();
          break;
        case 'land':
          result = await this.land();
          break;
        case 'emergency':
          result = await this.emergencyStop();
          break;
        case 'move':
          result = await this.move(params.direction, params.distance);
          break;
        case 'rotate':
          result = await this.rotate(params.degrees);
          break;
        case 'capture_photo':
          result = await this.capturePhoto();
          break;
        case 'start_recording':
          result = await this.startRecording();
          break;
        case 'stop_recording':
          result = await this.stopRecording();
          break;
        case 'set_speed':
          result = await this.setSpeed(params.speed);
          break;
        default:
          throw new Error(`Unknown command: ${command}`);
      }

      // Log command execution
      await this.logCommand(command, params, result);
      
      return result;
    } catch (error) {
      logger.error(`Command execution failed: ${command}`, error);
      throw error;
    }
  }

  // Flight control methods
  async takeoff() {
    logger.info('Executing takeoff command');
    
    // Simulate takeoff sequence
    await this.simulateFlightOperation('takeoff');
    
    this.droneStatus.altitude = 1.5; // 1.5 meters
    this.broadcastStatus();
    
    return { success: true, message: 'Takeoff successful', altitude: this.droneStatus.altitude };
  }

  async land() {
    logger.info('Executing land command');
    
    // Simulate landing sequence
    await this.simulateFlightOperation('land');
    
    this.droneStatus.altitude = 0;
    this.broadcastStatus();
    
    return { success: true, message: 'Landing successful' };
  }

  async emergencyStop() {
    logger.warn('EMERGENCY STOP EXECUTED');
    
    // Immediate stop and land
    this.droneStatus.altitude = 0;
    this.droneStatus.speed = 0;
    
    if (this.activeMission) {
      this.activeMission.status = 'emergency_stopped';
      this.activeMission = null;
    }
    
    this.broadcastStatus();
    
    return { success: true, message: 'Emergency stop executed', altitude: 0 };
  }

  async move(direction, distance) {
    logger.info(`Moving drone ${direction} by ${distance}cm`);
    
    // Simulate movement
    await this.simulateFlightOperation('move');
    
    // Update position based on direction
    const moveDistance = distance / 100; // Convert cm to meters
    switch (direction) {
      case 'forward':
        this.droneStatus.position.y += moveDistance;
        break;
      case 'back':
        this.droneStatus.position.y -= moveDistance;
        break;
      case 'left':
        this.droneStatus.position.x -= moveDistance;
        break;
      case 'right':
        this.droneStatus.position.x += moveDistance;
        break;
      case 'up':
        this.droneStatus.position.z += moveDistance;
        this.droneStatus.altitude = this.droneStatus.position.z;
        break;
      case 'down':
        this.droneStatus.position.z -= moveDistance;
        this.droneStatus.altitude = this.droneStatus.position.z;
        break;
    }
    
    this.broadcastStatus();
    
    return { 
      success: true, 
      message: `Moved ${direction} by ${distance}cm`,
      newPosition: this.droneStatus.position
    };
  }

  async rotate(degrees) {
    logger.info(`Rotating drone by ${degrees} degrees`);
    
    // Simulate rotation
    await this.simulateFlightOperation('rotate');
    
    this.droneStatus.orientation.yaw += degrees;
    this.broadcastStatus();
    
    return { 
      success: true, 
      message: `Rotated by ${degrees} degrees`,
      newYaw: this.droneStatus.orientation.yaw
    };
  }

  // Camera operations
  async capturePhoto() {
    logger.info('Capturing photo');
    
    const photoId = uuidv4();
    const timestamp = new Date();
    
    // Simulate photo capture
    await this.simulateFlightOperation('photo');
    
    // Save photo metadata to local database
    await this.savePhotoMetadata(photoId, timestamp);
    
    // Save photo to Supabase (simulated file path for now)
    try {
      const photoMetadata = {
        droneId: 'DRONE_001',
        missionId: this.activeMission?.id || null,
        timestamp: timestamp.toISOString(),
        location: this.droneStatus.position,
        altitude: this.droneStatus.altitude,
        farmId: 'FARM_001',
        agentAccessLevel: 'viewer',
        tags: ['drone-capture', 'farm-monitoring'],
        cameraSettings: {
          iso: 100,
          shutterSpeed: '1/1000',
          aperture: 'f/2.8'
        }
      };
      
      // In a real implementation, you would pass the actual photo file
      // For now, we'll create a placeholder file path
      const placeholderPhotoPath = `/tmp/drone_photo_${photoId}.jpg`;
      
      await this.supabaseMedia.uploadDronePhoto(placeholderPhotoPath, photoMetadata);
      logger.info('Photo saved to Supabase successfully');
    } catch (error) {
      logger.error('Failed to save photo to Supabase:', error);
      // Don't fail the operation if Supabase upload fails
    }
    
    return { 
      success: true, 
      message: 'Photo captured successfully',
      photoId,
      timestamp
    };
  }

  async startRecording() {
    logger.info('Starting video recording');
    
    const recordingId = uuidv4();
    const timestamp = new Date();
    
    // Simulate recording start
    await this.simulateFlightOperation('recording_start');
    
    this.droneStatus.recording = { id: recordingId, startTime: timestamp };
    this.broadcastStatus();
    
    return { 
      success: true, 
      message: 'Recording started',
      recordingId,
      timestamp
    };
  }

  async stopRecording() {
    logger.info('Stopping video recording');
    
    if (!this.droneStatus.recording) {
      throw new Error('No active recording');
    }
    
    // Simulate recording stop
    await this.simulateFlightOperation('recording_stop');
    
    const recording = this.droneStatus.recording;
    this.droneStatus.recording = null;
    
    // Save recording metadata to local database
    await this.saveRecordingMetadata(recording.id, recording.startTime, new Date());
    
    // Save video to Supabase
    try {
      const videoMetadata = {
        droneId: 'DRONE_001',
        missionId: this.activeMission?.id || null,
        timestamp: recording.startTime.toISOString(),
        duration: Math.floor((new Date() - recording.startTime) / 1000), // Duration in seconds
        location: this.droneStatus.position,
        altitude: this.droneStatus.altitude,
        farmId: 'FARM_001',
        agentAccessLevel: 'viewer',
        tags: ['drone-video', 'farm-monitoring', 'mission-recording']
      };
      
      // In a real implementation, you would pass the actual video file
      // For now, we'll create a placeholder file path
      const placeholderVideoPath = `/tmp/drone_video_${recording.id}.mp4`;
      
      await this.supabaseMedia.uploadDroneVideo(placeholderVideoPath, videoMetadata);
      logger.info('Video saved to Supabase successfully');
    } catch (error) {
      logger.error('Failed to save video to Supabase:', error);
      // Don't fail the operation if Supabase upload fails
    }
    
    this.broadcastStatus();
    
    return { 
      success: true, 
      message: 'Recording stopped',
      recordingId: recording.id,
      duration: new Date() - recording.startTime
    };
  }

  // Speed control
  async setSpeed(speed) {
    logger.info(`Setting drone speed to ${speed}cm/s`);
    
    if (speed < 10 || speed > 100) {
      throw new Error('Speed must be between 10 and 100 cm/s');
    }
    
    this.droneStatus.speed = speed;
    this.broadcastStatus();
    
    return { 
      success: true, 
      message: `Speed set to ${speed}cm/s`,
      speed: this.droneStatus.speed
    };
  }

  // Mission management
  async startMission(missionId) {
    try {
      logger.info(`Starting mission: ${missionId}`);
      
      const mission = await this.getMission(missionId);
      if (!mission) {
        throw new Error('Mission not found');
      }
      
      this.activeMission = mission;
      this.activeMission.status = 'in_progress';
      this.activeMission.startTime = new Date();
      
      // Execute mission waypoints
      await this.executeMissionWaypoints(mission.waypoints);
      
      return { success: true, message: 'Mission started successfully' };
    } catch (error) {
      logger.error('Failed to start mission:', error);
      throw error;
    }
  }

  async executeMissionWaypoints(waypoints) {
    for (const waypoint of waypoints) {
      try {
        logger.info(`Executing waypoint: ${waypoint.id}`);
        
        // Move to waypoint
        await this.moveToWaypoint(waypoint);
        
        // Wait at waypoint if specified
        if (waypoint.waitTime) {
          await this.wait(waypoint.waitTime);
        }
        
        // Execute waypoint action if specified
        if (waypoint.action) {
          await this.executeWaypointAction(waypoint.action);
        }
        
      } catch (error) {
        logger.error(`Waypoint execution failed: ${waypoint.id}`, error);
        throw error;
      }
    }
  }

  async moveToWaypoint(waypoint) {
    // Calculate distance and direction to waypoint
    const dx = waypoint.x - this.droneStatus.position.x;
    const dy = waypoint.y - this.droneStatus.position.y;
    const dz = waypoint.z - this.droneStatus.position.z;
    
    // Move in sequence: up/down, forward/back, left/right
    if (Math.abs(dz) > 0.1) {
      const direction = dz > 0 ? 'up' : 'down';
      await this.move(direction, Math.abs(dz) * 100);
    }
    
    if (Math.abs(dy) > 0.1) {
      const direction = dy > 0 ? 'forward' : 'back';
      await this.move(direction, Math.abs(dy) * 100);
    }
    
    if (Math.abs(dx) > 0.1) {
      const direction = dx > 0 ? 'right' : 'left';
      await this.move(direction, Math.abs(dx) * 100);
    }
  }

  async executeWaypointAction(action) {
    switch (action.type) {
      case 'photo':
        await this.capturePhoto();
        break;
      case 'video':
        await this.startRecording();
        await this.wait(action.duration || 5000);
        await this.stopRecording();
        break;
      case 'wait':
        await this.wait(action.duration);
        break;
    }
  }

  // Utility methods
  async simulateFlightOperation(operation) {
    return new Promise((resolve) => {
      setTimeout(() => {
        logger.debug(`Simulated ${operation} operation completed`);
        resolve();
      }, 1000);
    });
  }

  async wait(milliseconds) {
    return new Promise((resolve) => {
      setTimeout(resolve, milliseconds);
    });
  }

  // Safety checks
  performSafetyChecks() {
    // Geofence check
    if (this.safetyChecks.geofence.enabled) {
      const pos = this.droneStatus.position;
      const bounds = this.safetyChecks.geofence.bounds;
      
      if (pos.x < bounds.x[0] || pos.x > bounds.x[1] ||
          pos.y < bounds.y[0] || pos.y > bounds.y[1] ||
          pos.z < bounds.z[0] || pos.z > bounds.z[1]) {
        logger.warn('Geofence violation detected');
        this.emergencyStop();
        return false;
      }
    }
    
    // Low battery check
    if (this.safetyChecks.lowBattery.enabled && 
        this.droneStatus.battery < this.safetyChecks.lowBattery.threshold) {
      logger.warn('Low battery detected, initiating return to home');
      this.returnToHome();
      return false;
    }
    
    // Max altitude check
    if (this.safetyChecks.maxAltitude.enabled && 
        this.droneStatus.altitude > this.safetyChecks.maxAltitude.limit) {
      logger.warn('Maximum altitude exceeded');
      this.emergencyStop();
      return false;
    }
    
    return true;
  }

  async returnToHome() {
    logger.info('Initiating return to home');
    
    // Move to home position (0, 0, 0)
    await this.moveToWaypoint({ x: 0, y: 0, z: 0 });
    await this.land();
  }

  // Telemetry updates
  startTelemetryUpdates() {
    this.telemetryInterval = setInterval(() => {
      this.updateTelemetry();
    }, 1000); // Update every second
  }

  updateTelemetry() {
    // Simulate telemetry updates
    if (this.droneStatus.connected) {
      // Simulate battery drain
      if (this.droneStatus.battery > 0) {
        this.droneStatus.battery = Math.max(0, this.droneStatus.battery - 0.01);
      }
      
      // Simulate temperature changes
      this.droneStatus.temperature = 25 + Math.sin(Date.now() / 10000) * 5;
      
      this.droneStatus.lastUpdate = new Date();
      
      // Perform safety checks
      this.performSafetyChecks();
      
      // Broadcast status
      this.broadcastStatus();
    }
  }

  broadcastStatus() {
    this.io.to('drone-telemetry').emit('drone-status', this.droneStatus);
  }

  // Database operations
  async logCommand(command, params, result) {
    const stmt = this.db.prepare(`
      INSERT INTO drone_commands (id, command, params, result, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(uuidv4(), command, JSON.stringify(params), JSON.stringify(result), new Date().toISOString());
    stmt.finalize();
  }

  async savePhotoMetadata(photoId, timestamp) {
    const stmt = this.db.prepare(`
      INSERT INTO drone_photos (id, timestamp, position, altitude)
      VALUES (?, ?, ?, ?)
    `);
    
    stmt.run(photoId, timestamp.toISOString(), JSON.stringify(this.droneStatus.position), this.droneStatus.altitude);
    stmt.finalize();
  }

  async saveRecordingMetadata(recordingId, startTime, endTime) {
    const stmt = this.db.prepare(`
      INSERT INTO drone_recordings (id, start_time, end_time, duration, position, altitude)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const duration = endTime - startTime;
    stmt.run(recordingId, startTime.toISOString(), endTime.toISOString(), duration, 
             JSON.stringify(this.droneStatus.position), this.droneStatus.altitude);
    stmt.finalize();
  }

  async getMission(missionId) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM missions WHERE id = ?', [missionId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Get current status
  getStatus() {
    return this.droneStatus;
  }

  // Cleanup
  cleanup() {
    if (this.telemetryInterval) {
      clearInterval(this.telemetryInterval);
    }
    
    if (this.droneStatus.connected) {
      this.land();
    }
  }
}

// Factory function to initialize the service
function initializeDroneService(io) {
  const service = new DroneService(io);
  service.initialize().catch(console.error);
  return service;
}

module.exports = { initializeDroneService, DroneService };
