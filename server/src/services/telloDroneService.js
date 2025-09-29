const Tello = require('tellojs');
const dgram = require('dgram');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * TelloDroneService - Real Ryzr Tello drone integration
 * Supports both tellojs library and direct UDP communication as fallback
 */
class TelloDroneService {
  constructor() {
    this.drone = null;
    this.isConnected = false;
    this.isFlying = false;
    this.isRecording = false;
    this.battery = 100;
    this.altitude = 0;
    this.speed = 0;
    this.temperature = 25;
    this.position = { x: 0, y: 0, z: 0 };
    this.orientation = { yaw: 0, pitch: 0, roll: 0 };
    this.lastUpdate = new Date().toISOString();
    
    // UDP fallback configuration
    this.telloIp = '192.168.10.1';
    this.telloPort = 8889;
    this.udpClient = null;
    this.useUdpFallback = false;
    
    // Connection state
    this.connectionId = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    
    // Event listeners
    this.eventListeners = new Map();
  }

  /**
   * Connect to the Tello drone
   * @returns {Promise<Object>} Connection result
   */
  async connect() {
    try {
      logger.info('🚁 Attempting to connect to Ryzr Tello drone...');
      
      // Try tellojs library first
      try {
        this.drone = new Tello();
        await this.drone.connect();
        
        // Set up event listeners for tellojs
        this.setupTelloJsListeners();
        
        this.isConnected = true;
        this.connectionId = uuidv4();
        this.reconnectAttempts = 0;
        
        logger.info('✅ Connected to Tello drone using tellojs library');
        
        // Send initial command to enter SDK mode
        await this.sendCommand('command');
        
        return {
          success: true,
          message: 'Connected to Ryzr Tello drone',
          connectionId: this.connectionId,
          method: 'tellojs'
        };
        
      } catch (telloJsError) {
        logger.warn('⚠️ tellojs connection failed, trying UDP fallback:', telloJsError.message);
        
        // Fallback to direct UDP communication
        return await this.connectUdp();
      }
      
    } catch (error) {
      logger.error('❌ Failed to connect to Tello drone:', error);
      this.isConnected = false;
      return {
        success: false,
        error: error.message,
        method: 'failed'
      };
    }
  }

  /**
   * Connect using direct UDP communication as fallback
   * @returns {Promise<Object>} Connection result
   */
  async connectUdp() {
    try {
      this.useUdpFallback = true;
      this.udpClient = dgram.createSocket('udp4');
      
      // Set up UDP event listeners
      this.udpClient.on('message', (msg, rinfo) => {
        const response = msg.toString().trim();
        logger.info(`📡 Drone response: ${response}`);
        this.handleDroneResponse(response);
      });
      
      this.udpClient.on('error', (err) => {
        logger.error('❌ UDP socket error:', err);
        this.isConnected = false;
      });
      
      // Test connection by sending 'command'
      await this.sendCommand('command');
      
      this.isConnected = true;
      this.connectionId = uuidv4();
      
      logger.info('✅ Connected to Tello drone using UDP fallback');
      
      return {
        success: true,
        message: 'Connected to Ryzr Tello drone (UDP)',
        connectionId: this.connectionId,
        method: 'udp'
      };
      
    } catch (error) {
      logger.error('❌ UDP connection failed:', error);
      this.isConnected = false;
      return {
        success: false,
        error: error.message,
        method: 'udp_failed'
      };
    }
  }

  /**
   * Set up event listeners for tellojs library
   */
  setupTelloJsListeners() {
    if (!this.drone) return;
    
    // Battery level updates
    this.drone.on('battery', (level) => {
      this.battery = level;
      this.updateStatus();
    });
    
    // Altitude updates
    this.drone.on('altitude', (alt) => {
      this.altitude = alt;
      this.updateStatus();
    });
    
    // Speed updates
    this.drone.on('speed', (spd) => {
      this.speed = spd;
      this.updateStatus();
    });
    
    // Temperature updates
    this.drone.on('temperature', (temp) => {
      this.temperature = temp;
      this.updateStatus();
    });
    
    // Position updates
    this.drone.on('position', (pos) => {
      this.position = pos;
      this.updateStatus();
    });
    
    // Orientation updates
    this.drone.on('orientation', (orient) => {
      this.orientation = orient;
      this.updateStatus();
    });
  }

  /**
   * Send command to the drone
   * @param {string} command - Command to send
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<string>} Drone response
   */
  async sendCommand(command, timeout = 5000) {
    if (!this.isConnected) {
      throw new Error('Not connected to drone');
    }
    
    try {
      logger.info(`📤 Sending command: ${command}`);
      
      if (this.useUdpFallback) {
        return await this.sendUdpCommand(command, timeout);
      } else {
        return await this.drone.send(command, timeout);
      }
    } catch (error) {
      logger.error(`❌ Command failed: ${command}`, error);
      throw error;
    }
  }

  /**
   * Send command via UDP
   * @param {string} command - Command to send
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<string>} Drone response
   */
  async sendUdpCommand(command, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const message = Buffer.from(command);
      let responseReceived = false;
      
      // Set up response handler
      const responseHandler = (msg, rinfo) => {
        if (!responseReceived) {
          responseReceived = true;
          const response = msg.toString().trim();
          logger.info(`📥 UDP response: ${response}`);
          resolve(response);
        }
      };
      
      // Set up error handler
      const errorHandler = (err) => {
        if (!responseReceived) {
          responseReceived = true;
          reject(err);
        }
      };
      
      // Set timeout
      const timeoutId = setTimeout(() => {
        if (!responseReceived) {
          responseReceived = true;
          reject(new Error(`Command timeout: ${command}`));
        }
      }, timeout);
      
      // Add temporary listeners
      this.udpClient.once('message', responseHandler);
      this.udpClient.once('error', errorHandler);
      
      // Send command
      this.udpClient.send(message, 0, message.length, this.telloPort, this.telloIp, (err) => {
        if (err && !responseReceived) {
          responseReceived = true;
          clearTimeout(timeoutId);
          reject(err);
        }
      });
      
      // Clean up on resolve/reject
      const cleanup = () => {
        clearTimeout(timeoutId);
        this.udpClient.removeListener('message', responseHandler);
        this.udpClient.removeListener('error', errorHandler);
      };
      
      // Override resolve/reject to include cleanup
      const originalResolve = resolve;
      const originalReject = reject;
      
      resolve = (value) => {
        cleanup();
        originalResolve(value);
      };
      
      reject = (error) => {
        cleanup();
        originalReject(error);
      };
    });
  }

  /**
   * Handle drone response
   * @param {string} response - Response from drone
   */
  handleDroneResponse(response) {
    this.lastUpdate = new Date().toISOString();
    
    // Parse telemetry data if it's in the format "pitch:1;roll:2;yaw:3;..."
    if (response.includes(';')) {
      try {
        const data = {};
        response.split(';').forEach(pair => {
          const [key, value] = pair.split(':');
          if (key && value) {
            data[key] = parseFloat(value);
          }
        });
        
        // Update drone state
        if (data.pitch !== undefined) this.orientation.pitch = data.pitch;
        if (data.roll !== undefined) this.orientation.roll = data.roll;
        if (data.yaw !== undefined) this.orientation.yaw = data.yaw;
        if (data.agx !== undefined) this.position.x = data.agx;
        if (data.agy !== undefined) this.position.y = data.agy;
        if (data.agz !== undefined) this.position.z = data.agz;
        if (data.bat !== undefined) this.battery = data.bat;
        if (data.h !== undefined) this.altitude = data.h;
        if (data.tof !== undefined) this.altitude = data.tof;
        
        this.updateStatus();
      } catch (error) {
        logger.warn('⚠️ Failed to parse telemetry data:', error);
      }
    }
  }

  /**
   * Update drone status and notify listeners
   */
  updateStatus() {
    this.lastUpdate = new Date().toISOString();
    
    const status = this.getStatus();
    
    // Notify all listeners
    this.eventListeners.forEach((callback) => {
      try {
        callback(status);
      } catch (error) {
        logger.error('❌ Error in status listener:', error);
      }
    });
  }

  /**
   * Take off
   * @returns {Promise<Object>} Takeoff result
   */
  async takeoff() {
    if (!this.isConnected) {
      throw new Error('Not connected to drone');
    }
    
    try {
      logger.info('🚁 Executing takeoff...');
      const response = await this.sendCommand('takeoff');
      
      this.isFlying = true;
      this.updateStatus();
      
      logger.info('✅ Takeoff successful');
      return {
        success: true,
        message: 'Takeoff successful',
        response: response,
        altitude: this.altitude
      };
    } catch (error) {
      logger.error('❌ Takeoff failed:', error);
      throw error;
    }
  }

  /**
   * Land
   * @returns {Promise<Object>} Landing result
   */
  async land() {
    if (!this.isConnected) {
      throw new Error('Not connected to drone');
    }
    
    try {
      logger.info('🛬 Executing landing...');
      const response = await this.sendCommand('land');
      
      this.isFlying = false;
      this.updateStatus();
      
      logger.info('✅ Landing successful');
      return {
        success: true,
        message: 'Landing successful',
        response: response,
        altitude: this.altitude
      };
    } catch (error) {
      logger.error('❌ Landing failed:', error);
      throw error;
    }
  }

  /**
   * Emergency stop
   * @returns {Promise<Object>} Emergency stop result
   */
  async emergency() {
    if (!this.isConnected) {
      throw new Error('Not connected to drone');
    }
    
    try {
      logger.warn('🚨 EXECUTING EMERGENCY STOP!');
      const response = await this.sendCommand('emergency');
      
      this.isFlying = false;
      this.updateStatus();
      
      logger.warn('✅ Emergency stop executed');
      return {
        success: true,
        message: 'Emergency stop executed',
        response: response
      };
    } catch (error) {
      logger.error('❌ Emergency stop failed:', error);
      throw error;
    }
  }

  /**
   * Move drone
   * @param {string} direction - Direction (up, down, left, right, forward, back)
   * @param {number} distance - Distance in cm
   * @returns {Promise<Object>} Move result
   */
  async move(direction, distance) {
    if (!this.isConnected) {
      throw new Error('Not connected to drone');
    }
    
    if (!this.isFlying) {
      throw new Error('Drone must be flying to move');
    }
    
    // Validate distance
    if (distance < 20 || distance > 500) {
      throw new Error('Distance must be between 20 and 500 cm');
    }
    
    try {
      const command = `${direction} ${distance}`;
      logger.info(`📤 Moving ${direction} by ${distance}cm...`);
      
      const response = await this.sendCommand(command);
      
      // Update position based on direction
      this.updatePositionAfterMove(direction, distance);
      this.updateStatus();
      
      logger.info(`✅ Move successful: ${direction} ${distance}cm`);
      return {
        success: true,
        message: `Moved ${direction} by ${distance}cm`,
        response: response,
        newPosition: this.position
      };
    } catch (error) {
      logger.error(`❌ Move failed: ${direction} ${distance}cm`, error);
      throw error;
    }
  }

  /**
   * Rotate drone
   * @param {number} degrees - Degrees to rotate (positive = clockwise, negative = counterclockwise)
   * @returns {Promise<Object>} Rotate result
   */
  async rotate(degrees) {
    if (!this.isConnected) {
      throw new Error('Not connected to drone');
    }
    
    if (!this.isFlying) {
      throw new Error('Drone must be flying to rotate');
    }
    
    // Validate degrees
    if (degrees < -360 || degrees > 360) {
      throw new Error('Degrees must be between -360 and 360');
    }
    
    try {
      const command = degrees >= 0 ? `cw ${degrees}` : `ccw ${Math.abs(degrees)}`;
      logger.info(`🔄 Rotating ${degrees} degrees...`);
      
      const response = await this.sendCommand(command);
      
      // Update orientation
      this.orientation.yaw = (this.orientation.yaw + degrees) % 360;
      this.updateStatus();
      
      logger.info(`✅ Rotation successful: ${degrees} degrees`);
      return {
        success: true,
        message: `Rotated by ${degrees} degrees`,
        response: response,
        newYaw: this.orientation.yaw
      };
    } catch (error) {
      logger.error(`❌ Rotation failed: ${degrees} degrees`, error);
      throw error;
    }
  }

  /**
   * Capture photo
   * @returns {Promise<Object>} Photo capture result
   */
  async capturePhoto() {
    if (!this.isConnected) {
      throw new Error('Not connected to drone');
    }
    
    try {
      logger.info('📸 Capturing photo...');
      const response = await this.sendCommand('take picture');
      
      const photoId = uuidv4();
      const timestamp = new Date().toISOString();
      
      logger.info('✅ Photo captured successfully');
      return {
        success: true,
        message: 'Photo captured successfully',
        response: response,
        photoId: photoId,
        timestamp: timestamp,
        position: this.position,
        altitude: this.altitude
      };
    } catch (error) {
      logger.error('❌ Photo capture failed:', error);
      throw error;
    }
  }

  /**
   * Start recording
   * @returns {Promise<Object>} Recording start result
   */
  async startRecording() {
    if (!this.isConnected) {
      throw new Error('Not connected to drone');
    }
    
    if (this.isRecording) {
      throw new Error('Already recording');
    }
    
    try {
      logger.info('🎥 Starting video recording...');
      const response = await this.sendCommand('streamon');
      
      this.isRecording = true;
      const recordingId = uuidv4();
      const timestamp = new Date().toISOString();
      
      logger.info('✅ Recording started');
      return {
        success: true,
        message: 'Recording started',
        response: response,
        recordingId: recordingId,
        timestamp: timestamp
      };
    } catch (error) {
      logger.error('❌ Recording start failed:', error);
      throw error;
    }
  }

  /**
   * Stop recording
   * @returns {Promise<Object>} Recording stop result
   */
  async stopRecording() {
    if (!this.isConnected) {
      throw new Error('Not connected to drone');
    }
    
    if (!this.isRecording) {
      throw new Error('Not currently recording');
    }
    
    try {
      logger.info('⏹️ Stopping video recording...');
      const response = await this.sendCommand('streamoff');
      
      this.isRecording = false;
      const recordingId = uuidv4();
      const timestamp = new Date().toISOString();
      
      logger.info('✅ Recording stopped');
      return {
        success: true,
        message: 'Recording stopped',
        response: response,
        recordingId: recordingId,
        timestamp: timestamp,
        duration: 'unknown' // Would need to track start time
      };
    } catch (error) {
      logger.error('❌ Recording stop failed:', error);
      throw error;
    }
  }

  /**
   * Set speed
   * @param {number} speed - Speed in cm/s (10-100)
   * @returns {Promise<Object>} Speed set result
   */
  async setSpeed(speed) {
    if (!this.isConnected) {
      throw new Error('Not connected to drone');
    }
    
    if (speed < 10 || speed > 100) {
      throw new Error('Speed must be between 10 and 100 cm/s');
    }
    
    try {
      const command = `speed ${speed}`;
      logger.info(`⚡ Setting speed to ${speed} cm/s...`);
      
      const response = await this.sendCommand(command);
      
      this.speed = speed;
      this.updateStatus();
      
      logger.info(`✅ Speed set to ${speed} cm/s`);
      return {
        success: true,
        message: `Speed set to ${speed} cm/s`,
        response: response,
        speed: speed
      };
    } catch (error) {
      logger.error(`❌ Speed setting failed: ${speed} cm/s`, error);
      throw error;
    }
  }

  /**
   * Update position after move
   * @param {string} direction - Direction moved
   * @param {number} distance - Distance moved
   */
  updatePositionAfterMove(direction, distance) {
    const radians = (this.orientation.yaw * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    
    switch (direction) {
      case 'forward':
        this.position.x += distance * sin;
        this.position.y += distance * cos;
        break;
      case 'back':
        this.position.x -= distance * sin;
        this.position.y -= distance * cos;
        break;
      case 'left':
        this.position.x -= distance * cos;
        this.position.y += distance * sin;
        break;
      case 'right':
        this.position.x += distance * cos;
        this.position.y -= distance * sin;
        break;
      case 'up':
        this.position.z += distance;
        this.altitude += distance;
        break;
      case 'down':
        this.position.z -= distance;
        this.altitude -= distance;
        break;
    }
  }

  /**
   * Get current drone status
   * @returns {Object} Current status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      flying: this.isFlying,
      recording: this.isRecording,
      battery: this.battery,
      altitude: this.altitude,
      speed: this.speed,
      temperature: this.temperature,
      position: { ...this.position },
      orientation: { ...this.orientation },
      lastUpdate: this.lastUpdate,
      connectionId: this.connectionId,
      method: this.useUdpFallback ? 'udp' : 'tellojs'
    };
  }

  /**
   * Add status listener
   * @param {Function} callback - Callback function
   * @returns {string} Listener ID
   */
  addStatusListener(callback) {
    const listenerId = uuidv4();
    this.eventListeners.set(listenerId, callback);
    return listenerId;
  }

  /**
   * Remove status listener
   * @param {string} listenerId - Listener ID
   */
  removeStatusListener(listenerId) {
    this.eventListeners.delete(listenerId);
  }

  /**
   * Disconnect from drone
   * @returns {Promise<Object>} Disconnect result
   */
  async disconnect() {
    try {
      logger.info('🔌 Disconnecting from Tello drone...');
      
      if (this.isRecording) {
        await this.stopRecording();
      }
      
      if (this.isFlying) {
        await this.land();
      }
      
      if (this.useUdpFallback && this.udpClient) {
        this.udpClient.close();
        this.udpClient = null;
      }
      
      if (this.drone && !this.useUdpFallback) {
        await this.drone.disconnect();
        this.drone = null;
      }
      
      this.isConnected = false;
      this.isFlying = false;
      this.isRecording = false;
      this.eventListeners.clear();
      
      logger.info('✅ Disconnected from Tello drone');
      return {
        success: true,
        message: 'Disconnected from Tello drone'
      };
    } catch (error) {
      logger.error('❌ Disconnect failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Reconnect to drone
   * @returns {Promise<Object>} Reconnect result
   */
  async reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      throw new Error('Maximum reconnection attempts reached');
    }
    
    this.reconnectAttempts++;
    logger.info(`🔄 Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
    
    await this.disconnect();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    
    return await this.connect();
  }
}

module.exports = TelloDroneService;
