const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const EnhancedAIAgentService = require('../services/enhancedAIAgentService');

// Initialize Enhanced AI Agent Service
const enhancedAgentService = new EnhancedAIAgentService();

class EnhancedAIAgentRoutes {
  constructor() {
    this.agentService = enhancedAgentService;
  }

  setupRoutes() {
    // === Core Orchestrator Endpoints ===
    
    // Submit a new task
    router.post('/tasks', async (req, res) => {
      try {
        const task = req.body;
        const traceId = req.headers['x-trace-id'] || `trace-${Date.now()}`;
        
        // Validate required fields
        if (!task.type || !task.requiredCapability) {
          return res.status(400).json({ 
            error: 'Missing required fields: type, requiredCapability',
            traceId 
          });
        }
        
        const result = await this.agentService.submitTask(task);
        
        res.setHeader('X-Trace-ID', traceId);
        res.json({ 
          success: true, 
          ...result, 
          traceId,
          message: 'Task submitted to orchestrator'
        });
      } catch (error) {
        logger.error('Task submission failed:', error);
        const traceId = req.headers['x-trace-id'] || `error-${Date.now()}`;
        res.setHeader('X-Trace-ID', traceId);
        res.status(500).json({ 
          error: error.message,
          traceId
        });
      }
    });

    // Get task status
    router.get('/tasks/:taskId', async (req, res) => {
      try {
        const { taskId } = req.params;
        const taskStatus = await this.agentService.getTaskStatus(taskId);
        
        if (!taskStatus) {
          return res.status(404).json({ 
            error: 'Task not found' 
          });
        }
        
        res.json({ 
          success: true, 
          task: taskStatus 
        });
      } catch (error) {
        logger.error('Task status retrieval failed:', error);
        res.status(500).json({ 
          error: error.message 
        });
      }
    });

    // Cancel a task
    router.delete('/tasks/:taskId', async (req, res) => {
      try {
        const { taskId } = req.params;
        const { reason } = req.body;
        
        const cancelled = await this.agentService.cancelTask(taskId, reason);
        
        res.json({ 
          success: true, 
          cancelled, 
          message: cancelled ? 'Task cancelled' : 'Task could not be cancelled' 
        });
      } catch (error) {
        logger.error('Task cancellation failed:', error);
        res.status(500).json({ 
          error: error.message 
        });
      }
    });

    // Get available agents
    router.get('/agents', async (req, res) => {
      try {
        const { capability } = req.query;
        const agents = await this.agentService.getAvailableAgents(capability);
        
        res.json({ 
          success: true, 
          agents 
        });
      } catch (error) {
        logger.error('Agent retrieval failed:', error);
        res.status(500).json({ 
          error: error.message 
        });
      }
    });

    // Get agent metrics
    router.get('/metrics', async (req, res) => {
      try {
        const { agentId } = req.query;
        const metrics = await this.agentService.getAgentMetrics(agentId);
        
        res.json({ 
          success: true, 
          metrics 
        });
      } catch (error) {
        logger.error('Metrics retrieval failed:', error);
        res.status(500).json({ 
          error: error.message 
        });
      }
    });

    // Get queue statistics
    router.get('/queue/stats', async (req, res) => {
      try {
        const stats = await this.agentService.getQueueStats();
        
        res.json({ 
          success: true, 
          ...stats 
        });
      } catch (error) {
        logger.error('Queue stats retrieval failed:', error);
        res.status(500).json({ 
          error: error.message 
        });
      }
    });

    // Register a new agent
    router.post('/register', async (req, res) => {
      try {
        const agent = req.body;
        
        // Validate agent registration
        if (!agent.agentId || !agent.name || !agent.type || !agent.capabilities) {
          return res.status(400).json({ 
            error: 'Missing required agent fields: agentId, name, type, capabilities' 
          });
        }
        
        await this.agentService.registerAgent(agent);
        
        res.json({ 
          success: true, 
          message: 'Agent registered successfully' 
        });
      } catch (error) {
        logger.error('Agent registration failed:', error);
        res.status(500).json({ 
          error: error.message 
        });
      }
    });

    // Agent heartbeat
    router.post('/heartbeat', async (req, res) => {
      try {
        const heartbeat = req.body;
        
        // Validate heartbeat
        if (!heartbeat.agentId || !heartbeat.capabilities) {
          return res.status(400).json({ 
            error: 'Missing required heartbeat fields: agentId, capabilities' 
          });
        }
        
        await this.agentService.heartbeat(heartbeat);
        
        res.json({ 
          success: true, 
          message: 'Heartbeat received',
          timestamp: new Date().toISOString() 
        });
      } catch (error) {
        logger.error('Heartbeat processing failed:', error);
        res.status(500).json({ 
          error: error.message 
        });
      }
    });

    // Get system events
    router.get('/events', async (req, res) => {
      try {
        const { limit = 50 } = req.query;
        const events = this.agentService.getEvents(parseInt(limit));
        
        res.json({ 
          success: true, 
          events 
        });
      } catch (error) {
        logger.error('Events retrieval failed:', error);
        res.status(500).json({ 
          error: error.message 
        });
      }
    });

    // === Legacy Compatibility Endpoints ===
    
    // Legacy status endpoint
    router.get('/status', async (req, res) => {
      try {
        const status = await this.agentService.getAgentStatus();
        res.json({ 
          success: true, 
          ...status 
        });
      } catch (error) {
        logger.error('Status retrieval failed:', error);
        res.status(500).json({ 
          error: error.message 
        });
      }
    });

    // Legacy execute endpoint
    router.post('/execute', async (req, res) => {
      try {
        const { taskType, payload } = req.body;
        
        if (!taskType) {
          return res.status(400).json({ 
            error: 'taskType is required' 
          });
        }
        
        const result = await this.agentService.executeTask(taskType, payload);
        
        res.json({ 
          success: true, 
          result 
        });
      } catch (error) {
        logger.error('Legacy execution failed:', error);
        res.status(500).json({ 
          error: error.message 
        });
      }
    });

    // === Specialized Task Endpoints ===
    
    // Computer vision analysis
    router.post('/vision/analyze', async (req, res) => {
      try {
        const { imageData, analysisType = 'fruit_counting' } = req.body;
        
        if (!imageData) {
          return res.status(400).json({ 
            error: 'imageData is required' 
          });
        }
        
        const { taskId } = await this.agentService.submitTask({
          type: 'vision_analysis',
          requiredCapability: analysisType,
          payload: { imageData, analysisType },
          priority: 1
        });
        
        res.json({ 
          success: true, 
          taskId,
          message: 'Vision analysis task submitted' 
        });
      } catch (error) {
        logger.error('Vision analysis failed:', error);
        res.status(500).json({ 
          error: error.message 
        });
      }
    });

    // Irrigation optimization
    router.post('/irrigation/optimize', async (req, res) => {
      try {
        const { sensorData, weatherData } = req.body;
        
        const { taskId } = await this.agentService.submitTask({
          type: 'irrigation_optimization',
          requiredCapability: 'irrigation_optimization',
          payload: { sensorData, weatherData },
          priority: 1
        });
        
        res.json({ 
          success: true, 
          taskId,
          message: 'Irrigation optimization task submitted' 
        });
      } catch (error) {
        logger.error('Irrigation optimization failed:', error);
        res.status(500).json({ 
          error: error.message 
        });
      }
    });

    // Crop health analysis
    router.post('/crop-health/analyze', async (req, res) => {
      try {
        const { imageData, metadata } = req.body;
        
        if (!imageData) {
          return res.status(400).json({ 
            error: 'imageData is required' 
          });
        }
        
        const { taskId } = await this.agentService.submitTask({
          type: 'crop_analysis',
          requiredCapability: 'crop_analysis',
          payload: { imageData, metadata },
          priority: 1
        });
        
        res.json({ 
          success: true, 
          taskId,
          message: 'Crop health analysis task submitted' 
        });
      } catch (error) {
        logger.error('Crop health analysis failed:', error);
        res.status(500).json({ 
          error: error.message 
        });
      }
    });

    // Drone mission planning
    router.post('/drone/mission-plan', async (req, res) => {
      try {
        const { mission_type, area, priority } = req.body;
        
        if (!mission_type || !area) {
          return res.status(400).json({ 
            error: 'mission_type and area are required' 
          });
        }
        
        const { taskId } = await this.agentService.submitTask({
          type: 'flight_planning',
          requiredCapability: 'flight_planning',
          payload: { mission_type, area, priority },
          priority: priority === 'high' ? 0 : priority === 'medium' ? 1 : 2
        });
        
        res.json({ 
          success: true, 
          taskId,
          message: 'Drone mission planning task submitted' 
        });
      } catch (error) {
        logger.error('Drone mission planning failed:', error);
        res.status(500).json({ 
          error: error.message 
        });
      }
    });

    // Weather analysis
    router.post('/weather/analyze', async (req, res) => {
      try {
        const { currentWeather, forecast } = req.body;
        
        const { taskId } = await this.agentService.submitTask({
          type: 'weather_analysis',
          requiredCapability: 'weather_analysis',
          payload: { currentWeather, forecast },
          priority: 2
        });
        
        res.json({ 
          success: true, 
          taskId,
          message: 'Weather analysis task submitted' 
        });
      } catch (error) {
        logger.error('Weather analysis failed:', error);
        res.status(500).json({ 
          error: error.message 
        });
      }
    });

    // === Health and Diagnostics ===
    
    // Health check
    router.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'Enhanced AI Agent Orchestrator',
        version: '1.0.0',
        agents: this.agentService.agents.size,
        activeAgents: Array.from(this.agentService.agents.values()).filter(a => a.status === 'active').length,
        timestamp: new Date().toISOString()
      });
    });

    // System diagnostics
    router.get('/diagnostics', async (req, res) => {
      try {
        const status = await this.agentService.getAgentStatus();
        const queueStats = await this.agentService.getQueueStats();
        const metrics = await this.agentService.getAgentMetrics();
        
        res.json({
          success: true,
          system: status,
          queue: queueStats,
          agents: metrics,
          events: this.agentService.getEvents(10),
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('Diagnostics failed:', error);
        res.status(500).json({ 
          error: error.message 
        });
      }
    });

    return router;
  }
}

module.exports = EnhancedAIAgentRoutes;
