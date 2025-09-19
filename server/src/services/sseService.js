const EventEmitter = require('events');
const { broadcastToSSEClients } = require('../routes/sse');

class SSEService extends EventEmitter {
  constructor() {
    super();
    this.dataSimulationInterval = null;
    this.startDataSimulation();
  }

  // Start data simulation for SSE clients
  startDataSimulation() {
    console.log('🔄 Starting SSE data simulation...');
    
    this.dataSimulationInterval = setInterval(() => {
      this.simulateDroneTelemetry();
      this.simulateSensorReadings();
      this.simulateWeatherData();
      this.simulateAgentStatus();
      this.simulateMissionProgress();
    }, 5000); // Send data every 5 seconds
  }

  simulateDroneTelemetry() {
    const telemetry = {
      droneId: 'drone_001',
      battery: Math.floor(Math.random() * 40) + 60, // 60-100%
      altitude: Math.floor(Math.random() * 50) + 10, // 10-60m
      speed: Math.floor(Math.random() * 15) + 5, // 5-20 m/s
      position: {
        lat: 40.7128 + (Math.random() - 0.5) * 0.01,
        lng: -74.0060 + (Math.random() - 0.5) * 0.01
      },
      status: ['flying', 'hovering', 'landing'][Math.floor(Math.random() * 3)],
      timestamp: Date.now(),
    };

    broadcastToSSEClients('drone_telemetry', telemetry);
  }

  simulateSensorReadings() {
    const readings = {
      npk: {
        nitrogen: Math.floor(Math.random() * 200) + 50,
        phosphorus: Math.floor(Math.random() * 100) + 20,
        potassium: Math.floor(Math.random() * 300) + 100,
      },
      ph: (Math.random() * 3 + 6).toFixed(1), // 6.0-9.0
      moisture: Math.floor(Math.random() * 40) + 30, // 30-70%
      electricalConductivity: (Math.random() * 2 + 0.5).toFixed(1), // 0.5-2.5 mS/cm
      temperature: Math.floor(Math.random() * 15) + 15, // 15-30°C
      humidity: Math.floor(Math.random() * 30) + 40, // 40-70%
      location: ['Field A', 'Field B', 'Field C'][Math.floor(Math.random() * 3)],
      timestamp: Date.now(),
    };

    broadcastToSSEClients('sensor_readings', readings);
  }

  simulateWeatherData() {
    const weather = {
      temperature: Math.floor(Math.random() * 20) + 15, // 15-35°C
      humidity: Math.floor(Math.random() * 40) + 30, // 30-70%
      pressure: Math.floor(Math.random() * 50) + 1000, // 1000-1050 hPa
      windSpeed: Math.floor(Math.random() * 20) + 5, // 5-25 km/h
      windDirection: Math.floor(Math.random() * 360),
      precipitation: Math.floor(Math.random() * 10), // 0-10 mm
      uvIndex: Math.floor(Math.random() * 10) + 1, // 1-10
      visibility: Math.floor(Math.random() * 10) + 5, // 5-15 km
      timestamp: Date.now(),
    };

    broadcastToSSEClients('weather_data', weather);
  }

  simulateAgentStatus() {
    const agents = ['drone_pilot', 'content_creator', 'customer_service', 'crop_health', 'weather_monitor'];
    const statuses = ['active', 'idle', 'processing', 'error'];
    
    agents.forEach(agentId => {
      const status = {
        agentId,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        lastActivity: new Date(Date.now() - Math.random() * 60000).toISOString(),
        currentTask: Math.random() > 0.5 ? `Task ${Math.floor(Math.random() * 100)}` : null,
        performance: {
          cpu: Math.floor(Math.random() * 80) + 10, // 10-90%
          memory: Math.floor(Math.random() * 70) + 20, // 20-90%
        },
        errors: Math.random() > 0.8 ? [`Error ${Math.floor(Math.random() * 10)}`] : [],
        timestamp: Date.now(),
      };

      broadcastToSSEClients('agent_status', status);
    });
  }

  simulateMissionProgress() {
    const missions = ['mission_001', 'mission_002', 'mission_003'];
    const statuses = ['active', 'paused', 'completed', 'failed'];
    
    missions.forEach(missionId => {
      const progress = {
        missionId,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        progress: Math.floor(Math.random() * 100),
        currentWaypoint: Math.floor(Math.random() * 10) + 1,
        totalWaypoints: 10,
        estimatedCompletion: new Date(Date.now() + Math.random() * 3600000).toISOString(),
        errors: Math.random() > 0.9 ? [`Mission error ${Math.floor(Math.random() * 5)}`] : [],
        timestamp: Date.now(),
      };

      broadcastToSSEClients('mission_progress', progress);
    });
  }

  // Get connection statistics
  getStats() {
    return {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    };
  }

  // Cleanup
  destroy() {
    if (this.dataSimulationInterval) {
      clearInterval(this.dataSimulationInterval);
      this.dataSimulationInterval = null;
    }
    console.log('🔄 SSE service destroyed');
  }
}

module.exports = SSEService;
