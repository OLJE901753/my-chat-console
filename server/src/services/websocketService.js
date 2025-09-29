const { WebSocketServer, WebSocket } = require('ws');
const logger = require('../utils/logger');
const supabasePersistence = require('./supabasePersistenceService');

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Set();
    this.heartbeatInterval = null;
    this.droneService = null;
    this.droneStatusInterval = null;
    this.weatherInterval = null;
    this.sensorInterval = null;
    this.agentInterval = null;
    this.cameraService = null;
  }

  initialize(server) {
    try {
      this.wss = new WebSocketServer({ 
        server,
        path: '/ws'
      });

      this.wss.on('connection', (ws) => {
        this.handleConnection(ws);
      });

      this.wss.on('error', (error) => {
        logger.error('WebSocket server error:', error);
      });

      this.startHeartbeat();
      this.startWeatherBroadcast();
      if (process.env.ENABLE_SENSOR_SIM === 'true') {
        this.startSensorBroadcast();
      }
      this.startAgentBroadcast();
      logger.info('WebSocket server initialized on /ws');
    } catch (error) {
      logger.error('Failed to initialize WebSocket server:', error);
      throw error;
    }
  }

  setDroneService(droneService) {
    this.droneService = droneService;
    this.startDroneStatusBroadcast();
    logger.info('Drone service connected to WebSocket service');
  }

  setCameraService(cameraService) {
    this.cameraService = cameraService;
    cameraService.setWebSocketService(this);
    logger.info('Camera service connected to WebSocket service');
  }

  handleConnection(ws) {
    this.clients.add(ws);
    logger.info(`WebSocket client connected. Total clients: ${this.clients.size}`);

    // Send welcome message
    this.sendToClient(ws, {
      type: 'system_status',
      data: { message: 'Connected to Farm Management System', status: 'connected' },
      timestamp: new Date().toISOString()
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(ws, message);
      } catch (error) {
        logger.error('Invalid WebSocket message:', error);
        this.sendToClient(ws, {
          type: 'system_status',
          data: { error: 'Invalid message format' },
          timestamp: new Date().toISOString()
        });
      }
    });

    ws.on('close', () => {
      this.clients.delete(ws);
      logger.info(`WebSocket client disconnected. Total clients: ${this.clients.size}`);
    });

    ws.on('error', (error) => {
      logger.error('WebSocket error:', error);
      this.clients.delete(ws);
    });
  }

  handleMessage(ws, message) {
    logger.debug('Received WebSocket message:', message);

    switch (message.type) {
      case 'ping':
        this.sendToClient(ws, {
          type: 'pong',
          data: { timestamp: new Date().toISOString() },
          timestamp: new Date().toISOString()
        });
        break;

      case 'subscribe':
        logger.info(`Client subscribed to: ${message.data?.events || 'all'}`);
        break;

      case 'drone_command':
        this.handleDroneCommand(ws, message);
        break;

      default:
        logger.warn('Unknown WebSocket message type:', message.type);
    }
  }

  async handleDroneCommand(ws, message) {
    if (!this.droneService) {
      this.sendToClient(ws, {
        type: 'drone_command_response',
        data: { 
          success: false, 
          error: 'Drone service not available' 
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    try {
      const { command, params } = message.data;
      logger.info(`📤 WebSocket drone command: ${command}`, params);

      let result;
      switch (command) {
        case 'takeoff':
          result = await this.droneService.takeoff();
          break;
        case 'land':
          result = await this.droneService.land();
          break;
        case 'emergency':
          result = await this.droneService.emergency();
          break;
        case 'move':
          result = await this.droneService.move(params.direction, params.distance);
          break;
        case 'rotate':
          result = await this.droneService.rotate(params.degrees);
          break;
        case 'capture_photo':
          result = await this.droneService.capturePhoto();
          break;
        case 'start_recording':
          result = await this.droneService.startRecording();
          break;
        case 'stop_recording':
          result = await this.droneService.stopRecording();
          break;
        case 'set_speed':
          result = await this.droneService.setSpeed(params.speed);
          break;
        default:
          result = { 
            success: false, 
            error: `Unknown command: ${command}` 
          };
      }

      this.sendToClient(ws, {
        type: 'drone_command_response',
        data: result,
        timestamp: new Date().toISOString()
      });

      // Broadcast the command result to all clients
      this.broadcast({
        type: 'drone_command_executed',
        data: {
          command,
          params,
          result
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error(`❌ WebSocket drone command failed: ${message.data.command}`, error);
      
      this.sendToClient(ws, {
        type: 'drone_command_response',
        data: { 
          success: false, 
          error: error.message 
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  sendToClient(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        logger.error('Failed to send WebSocket message:', error);
        this.clients.delete(ws);
      }
    }
  }

  broadcast(message) {
    const messageStr = JSON.stringify(message);
    let sentCount = 0;

    this.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(messageStr);
          sentCount++;
        } catch (error) {
          logger.error('Failed to broadcast message:', error);
          this.clients.delete(ws);
        }
      }
    });

    logger.debug(`Broadcasted message to ${sentCount} clients`);
  }

  getStats() {
    return {
      connectedClients: this.clients.size,
      isRunning: this.wss !== null
    };
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.broadcast({
        type: 'system_status',
        data: { 
          status: 'healthy',
          connected_clients: this.clients.size,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });
    }, 30000);
  }

  startDroneStatusBroadcast() {
    if (this.droneStatusInterval) {
      clearInterval(this.droneStatusInterval);
    }

    // Broadcast drone status every 2 seconds
    this.droneStatusInterval = setInterval(async () => {
      if (this.droneService && this.clients.size > 0) {
        const droneStatus = this.droneService.getStatus();
        const timestamp = new Date().toISOString();

        // Persist drone telemetry to Supabase
        await supabasePersistence.persistDroneTelemetry({
          ...droneStatus,
          timestamp: timestamp
        });

        this.broadcast({
          type: 'drone_status',
          data: droneStatus,
          timestamp: timestamp
        });

        // Also broadcast specific events when status changes
        this.checkForStatusChanges(droneStatus);
      }
    }, 2000);

    logger.info('Drone status broadcasting started (every 2 seconds)');
  }

  startWeatherBroadcast() {
    if (this.weatherInterval) {
      clearInterval(this.weatherInterval);
    }

    // Broadcast weather data every 5 minutes
    this.weatherInterval = setInterval(async () => {
      if (this.clients.size > 0) {
        try {
          const weatherData = await this.fetchWeatherData();
          this.broadcast({
            type: 'weather_data',
            data: weatherData,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          logger.error('Failed to fetch weather data for broadcast:', error);
        }
      }
    }, 5 * 60 * 1000); // 5 minutes

    logger.info('Weather data broadcasting started (every 5 minutes)');
  }

  async fetchWeatherData() {
    try {
      const response = await fetch('http://localhost:3001/api/netatmo/weather');
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }
      const result = await response.json();
      
      // Persist weather data to Supabase
      if (result.success && result.data) {
        await supabasePersistence.persistWeatherData({
          ...result.data,
          stationId: result.deviceId || 'SN44560',
          source: 'netatmo'
        });
      }
      
      return result.success ? result.data : null;
    } catch (error) {
      logger.error('Failed to fetch weather data:', error);
      return null;
    }
  }

  startSensorBroadcast() {
    if (this.sensorInterval) {
      clearInterval(this.sensorInterval);
    }

    // Broadcast sensor data every 30 seconds
    this.sensorInterval = setInterval(async () => {
      if (this.clients.size > 0) {
        const sensorData = this.generateSensorData();
        const timestamp = new Date().toISOString();
        
        // Persist to Supabase
        await supabasePersistence.persistSensorReading({
          sensor_type: 'simulated',
          location: 'Farm Field 1',
          data: sensorData,
          timestamp: timestamp
        });
        
        this.broadcast({
          type: 'sensor_readings',
          data: sensorData,
          timestamp: timestamp
        });
      }
    }, 30000); // 30 seconds

    logger.info('Sensor data broadcasting started (every 30 seconds)');
  }

  generateSensorData() {
    // Generate realistic farm sensor data
    const baseTime = Date.now();
    const hour = new Date().getHours();
    
    // Simulate day/night temperature variation
    const tempVariation = Math.sin((hour - 6) * Math.PI / 12) * 5;
    const baseTemp = 18 + tempVariation;
    
    return {
      npk: {
        nitrogen: Math.round(140 + Math.random() * 20),
        phosphorus: Math.round(35 + Math.random() * 10),
        potassium: Math.round(160 + Math.random() * 20)
      },
      ph: Math.round((6.5 + Math.random() * 0.6) * 10) / 10,
      moisture: Math.round(60 + Math.random() * 20),
      electricalConductivity: Math.round((1.0 + Math.random() * 0.5) * 10) / 10,
      temperature: Math.round((baseTemp + (Math.random() - 0.5) * 2) * 10) / 10,
      humidity: Math.round(65 + Math.random() * 15),
      location: 'Field A - Apple Orchard',
      timestamp: baseTime
    };
  }

  startAgentBroadcast() {
    if (this.agentInterval) {
      clearInterval(this.agentInterval);
    }

    // Broadcast agent status every 2 minutes
    this.agentInterval = setInterval(async () => {
      if (this.clients.size > 0) {
        try {
          const agentData = await this.fetchAgentData();
          const timestamp = new Date().toISOString();
          
          // Persist agent status to Supabase
          if (agentData && agentData.agents) {
            for (const agent of agentData.agents) {
              await supabasePersistence.persistAgentStatus({
                agentId: agent.id,
                action: 'status_update',
                message: `Agent ${agent.name} is ${agent.status}`,
                success: agent.status === 'active',
                timestamp: timestamp
              });
            }
          }
          
          this.broadcast({
            type: 'agent_status',
            data: agentData,
            timestamp: timestamp
          });
        } catch (error) {
          logger.error('Failed to fetch agent data for broadcast:', error);
        }
      }
    }, 2 * 60 * 1000); // 2 minutes

    logger.info('Agent status broadcasting started (every 2 minutes)');
  }

  async fetchAgentData() {
    try {
      const response = await fetch('http://localhost:3001/api/ai-agents/status');
      if (!response.ok) {
        throw new Error(`Agent API error: ${response.status}`);
      }
      const result = await response.json();
      return result.success ? result : null;
    } catch (error) {
      logger.error('Failed to fetch agent data:', error);
      return null;
    }
  }

  checkForStatusChanges(currentStatus) {
    if (!this.lastDroneStatus) {
      this.lastDroneStatus = currentStatus;
      return;
    }

    const changes = [];
    
    // Check for connection status changes
    if (this.lastDroneStatus.connected !== currentStatus.connected) {
      changes.push({
        type: 'connection_change',
        data: {
          connected: currentStatus.connected,
          message: currentStatus.connected ? 'Drone connected' : 'Drone disconnected'
        }
      });
    }

    // Check for flying status changes
    if (this.lastDroneStatus.flying !== currentStatus.flying) {
      changes.push({
        type: 'flight_status_change',
        data: {
          flying: currentStatus.flying,
          message: currentStatus.flying ? 'Drone took off' : 'Drone landed'
        }
      });
    }

    // Check for recording status changes
    if (this.lastDroneStatus.recording !== currentStatus.recording) {
      changes.push({
        type: 'recording_status_change',
        data: {
          recording: currentStatus.recording,
          message: currentStatus.recording ? 'Recording started' : 'Recording stopped'
        }
      });
    }

    // Check for battery level changes (warn at 20%)
    if (currentStatus.battery <= 20 && this.lastDroneStatus.battery > 20) {
      changes.push({
        type: 'battery_warning',
        data: {
          battery: currentStatus.battery,
          message: `Low battery warning: ${currentStatus.battery}%`
        }
      });
    }

    // Broadcast any changes
    changes.forEach(change => {
      this.broadcast({
        ...change,
        timestamp: new Date().toISOString()
      });
    });

    this.lastDroneStatus = currentStatus;
  }

  close() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.droneStatusInterval) {
      clearInterval(this.droneStatusInterval);
      this.droneStatusInterval = null;
    }

    if (this.weatherInterval) {
      clearInterval(this.weatherInterval);
      this.weatherInterval = null;
    }

    if (this.sensorInterval) {
      clearInterval(this.sensorInterval);
      this.sensorInterval = null;
    }

    if (this.agentInterval) {
      clearInterval(this.agentInterval);
      this.agentInterval = null;
    }

    this.clients.forEach((ws) => {
      ws.close();
    });
    this.clients.clear();

    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }

    logger.info('WebSocket service closed');
  }
}

module.exports = new WebSocketService();