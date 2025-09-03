const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

class AIAgentRoutes {
  constructor(aiAgentService) {
    this.aiAgentService = aiAgentService;
  }

  setupRoutes() {
    // Get all agent metrics and status
    router.get('/status', async (req, res) => {
      try {
        const agents = [
          'crop-health-monitor',
          'irrigation-optimizer', 
          'predictive-maintenance',
          'farm-analytics',
          'weather-intelligence',
          'computer-vision',
          'drone-pilot-ai',
          'content-creation-agent',
          'customer-service-agent'
        ];

        const status = {};
        for (const agentId of agents) {
          try {
            // Get basic agent information
            const agentInfo = await this.aiAgentService.getAgentInfo(agentId);
            
            // Get metrics if available (will be empty initially)
            const metrics = await this.aiAgentService.getAgentMetrics(agentId);
            
            status[agentId] = {
              ...agentInfo,
              ...metrics,
              last_update: new Date().toISOString()
            };
          } catch (error) {
            // If metrics fail, still return basic agent info
            const agentInfo = await this.aiAgentService.getAgentInfo(agentId);
            status[agentId] = {
              ...agentInfo,
              total_tasks: 0,
              avg_execution_time: 0,
              avg_confidence: 0,
              success_rate: 0,
              last_update: new Date().toISOString()
            };
          }
        }

        res.json(status);
      } catch (error) {
        logger.error('Failed to get AI agent status:', error);
        res.status(500).json({ error: 'Failed to get agent status' });
      }
    });

    // Analyze crop health (triggered by drone image upload)
    router.post('/crop-health/analyze', async (req, res) => {
      try {
        const { imageData, metadata } = req.body;
        
        if (!imageData) {
          return res.status(400).json({ error: 'Image data required' });
        }

        const analysis = await this.aiAgentService.analyzeCropHealth({
          imageData,
          metadata,
          timestamp: new Date().toISOString()
        });

        res.json(analysis);
      } catch (error) {
        logger.error('Crop health analysis failed:', error);
        res.status(500).json({ error: 'Analysis failed' });
      }
    });

    // Optimize irrigation (triggered by sensor data)
    router.post('/irrigation/optimize', async (req, res) => {
      try {
        const { sensorData, weatherData } = req.body;
        
        const optimization = await this.aiAgentService.optimizeIrrigation(
          sensorData, 
          weatherData || {}
        );

        res.json(optimization);
      } catch (error) {
        logger.error('Irrigation optimization failed:', error);
        res.status(500).json({ error: 'Optimization failed' });
      }
    });

    // Predictive maintenance analysis
    router.post('/maintenance/analyze', async (req, res) => {
      try {
        const { equipmentData } = req.body;
        
        const analysis = await this.aiAgentService.analyzePredictiveMaintenance(
          equipmentData || {}
        );

        res.json(analysis);
      } catch (error) {
        logger.error('Predictive maintenance analysis failed:', error);
        res.status(500).json({ error: 'Analysis failed' });
      }
    });

    // Weather intelligence analysis
    router.post('/weather/analyze', async (req, res) => {
      try {
        const { currentWeather, forecast } = req.body;
        
        // Use default weather data if none provided
        const defaultWeather = {
          temperature: 18 + Math.random() * 10,
          humidity: 60 + Math.random() * 20,
          windSpeed: 5 + Math.random() * 10,
          precipitation: Math.random() * 2,
          visibility: 8 + Math.random() * 5,
          cloudCover: Math.random() * 100,
          timestamp: new Date().toISOString()
        };

        const defaultForecast = Array(24).fill(null).map((_, i) => ({
          ...defaultWeather,
          temperature: defaultWeather.temperature + (Math.random() - 0.5) * 5,
          timestamp: new Date(Date.now() + i * 60 * 60 * 1000).toISOString()
        }));

        const analysis = await this.aiAgentService.analyzeWeatherIntelligence(
          currentWeather || defaultWeather,
          forecast || defaultForecast
        );

        res.json(analysis);
      } catch (error) {
        logger.error('Weather intelligence analysis failed:', error);
        res.status(500).json({ error: 'Analysis failed' });
      }
    });

    // Computer vision analysis
    router.post('/vision/analyze', async (req, res) => {
      try {
        const { imageData, analysisType } = req.body;
        
        if (!imageData) {
          return res.status(400).json({ error: 'Image data required' });
        }

        const analysis = await this.aiAgentService.analyzeComputerVision({
          imageData,
          analysisType: analysisType || 'fruit_counting',
          timestamp: new Date().toISOString()
        });

        res.json(analysis);
      } catch (error) {
        logger.error('Computer vision analysis failed:', error);
        res.status(500).json({ error: 'Analysis failed' });
      }
    });

    // Get active alerts
    router.get('/alerts', async (req, res) => {
      try {
        const { agentId } = req.query;
        const alerts = await this.aiAgentService.getActiveAlerts(agentId);
        res.json(alerts);
      } catch (error) {
        logger.error('Failed to get alerts:', error);
        res.status(500).json({ error: 'Failed to get alerts' });
      }
    });

    // Acknowledge alert
    router.post('/alerts/:alertId/acknowledge', async (req, res) => {
      try {
        const { alertId } = req.params;
        const success = await this.aiAgentService.acknowledgeAlert(alertId);
        res.json({ success });
      } catch (error) {
        logger.error('Failed to acknowledge alert:', error);
        res.status(500).json({ error: 'Failed to acknowledge alert' });
      }
    });

    // Get agent metrics for specific timeframe
    router.get('/metrics/:agentId', async (req, res) => {
      try {
        const { agentId } = req.params;
        const { timeframe = '24h' } = req.query;
        
        const metrics = await this.aiAgentService.getAgentMetrics(agentId, timeframe);
        res.json(metrics);
      } catch (error) {
        logger.error(`Failed to get metrics for ${agentId}:`, error);
        res.status(500).json({ error: 'Failed to get metrics' });
      }
    });

    // Trigger automated analysis based on current sensor/drone data
    router.post('/analyze/auto', async (req, res) => {
      try {
        const results = {};

        // Simulate getting current data from various sources
        const mockSensorData = {
          moisture: 45 + Math.random() * 30,
          npk_nitrogen: 50 + Math.random() * 50,
          npk_phosphorus: 30 + Math.random() * 40,
          npk_potassium: 40 + Math.random() * 60,
          ph: 6.0 + Math.random() * 2,
          electrical_conductivity: 0.8 + Math.random() * 0.5,
          temperature: 15 + Math.random() * 15,
          battery: 70 + Math.random() * 30
        };

        const mockEquipmentData = {
          drones: [
            { id: 'drone_01', battery_cycles: 450 + Math.random() * 100, flight_hours: 120 + Math.random() * 50 },
            { id: 'drone_02', battery_cycles: 380 + Math.random() * 100, flight_hours: 95 + Math.random() * 40 }
          ],
          sensors: [
            { id: 'sensor_01', last_calibration: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) },
            { id: 'sensor_02', last_calibration: new Date(Date.now() - Math.random() * 45 * 24 * 60 * 60 * 1000) }
          ]
        };

        // Run irrigation optimization
        try {
          results.irrigation = await this.aiAgentService.optimizeIrrigation(mockSensorData, {});
        } catch (error) {
          logger.error('Auto irrigation analysis failed:', error);
          results.irrigation = { error: 'Analysis failed' };
        }

        // Run predictive maintenance
        try {
          results.maintenance = await this.aiAgentService.analyzePredictiveMaintenance(mockEquipmentData);
        } catch (error) {
          logger.error('Auto maintenance analysis failed:', error);
          results.maintenance = { error: 'Analysis failed' };
        }

        // Run weather analysis
        try {
          results.weather = await this.aiAgentService.analyzeWeatherIntelligence({}, []);
        } catch (error) {
          logger.error('Auto weather analysis failed:', error);
          results.weather = { error: 'Analysis failed' };
        }

        res.json({
          success: true,
          analyses: results,
          triggered_at: new Date().toISOString()
        });

      } catch (error) {
        logger.error('Automated analysis failed:', error);
        res.status(500).json({ error: 'Automated analysis failed' });
      }
    });

    // Drone Pilot AI - Mission Planning
    router.post('/drone/mission-plan', async (req, res) => {
      try {
        const { mission_type, area, priority } = req.body;
        
        const mission = await this.aiAgentService.planDroneMission({
          mission_type,
          area,
          priority
        });

        res.json(mission);
      } catch (error) {
        logger.error('Drone mission planning failed:', error);
        res.status(500).json({ error: 'Mission planning failed' });
      }
    });

    // Drone Pilot AI - Execute Mission
    router.post('/drone/mission/:missionId/execute', async (req, res) => {
      try {
        const { missionId } = req.params;
        
        const execution = await this.aiAgentService.executeDroneMission(missionId);

        res.json(execution);
      } catch (error) {
        logger.error('Drone mission execution failed:', error);
        res.status(500).json({ error: 'Mission execution failed' });
      }
    });

    // Drone Pilot AI - Emergency Stop
    router.post('/drone/:droneId/emergency-stop', async (req, res) => {
      try {
        const { droneId } = req.params;
        
        const stopResult = await this.aiAgentService.emergencyStopDrone(droneId);

        res.json(stopResult);
      } catch (error) {
        logger.error('Drone emergency stop failed:', error);
        res.status(500).json({ error: 'Emergency stop failed' });
      }
    });

    // Content Creation Agent - Plan Content Capture
    router.post('/content/plan-capture', async (req, res) => {
      try {
        const { content_type, target, duration } = req.body;
        
        const plan = await this.aiAgentService.planContentCapture({
          content_type,
          target,
          duration
        });

        res.json(plan);
      } catch (error) {
        logger.error('Content capture planning failed:', error);
        res.status(500).json({ error: 'Content planning failed' });
      }
    });

    // Content Creation Agent - Execute Content Plan
    router.post('/content/plan/:planId/execute', async (req, res) => {
      try {
        const { planId } = req.params;
        
        const execution = await this.aiAgentService.executeContentPlan(planId);

        res.json(execution);
      } catch (error) {
        logger.error('Content plan execution failed:', error);
        res.status(500).json({ error: 'Content execution failed' });
      }
    });

    // Content Creation Agent - Quality Assessment
    router.get('/content/:contentId/assess-quality', async (req, res) => {
      try {
        const { contentId } = req.params;
        
        const assessment = await this.aiAgentService.assessContentQuality(contentId);

        res.json(assessment);
      } catch (error) {
        logger.error('Content quality assessment failed:', error);
        res.status(500).json({ error: 'Quality assessment failed' });
      }
    });

    // Customer Service AI - Handle Inquiry
    router.post('/customer-service/inquiry', async (req, res) => {
      try {
        const { inquiry_type, message, priority } = req.body;
        
        if (!inquiry_type || !message) {
          return res.status(400).json({ error: 'Inquiry type and message required' });
        }

        const response = await this.aiAgentService.handleCustomerInquiry({
          inquiry_type,
          message,
          priority
        });

        res.json(response);
      } catch (error) {
        logger.error('Customer inquiry handling failed:', error);
        res.status(500).json({ error: 'Customer inquiry handling failed' });
      }
    });

    // Customer Service AI - Simulate Phone Call
    router.post('/customer-service/phone-call', async (req, res) => {
      try {
        const { call_type, duration, customer_type } = req.body;
        
        const callResult = await this.aiAgentService.simulatePhoneCall({
          call_type,
          duration,
          customer_type
        });

        res.json(callResult);
      } catch (error) {
        logger.error('Phone call simulation failed:', error);
        res.status(500).json({ error: 'Phone call simulation failed' });
      }
    });

    // Customer Service AI - Process Email
    router.post('/customer-service/email', async (req, res) => {
      try {
        const { subject, content, sender, priority } = req.body;
        
        const emailResult = await this.aiAgentService.processEmail({
          subject,
          content,
          sender,
          priority
        });

        res.json(emailResult);
      } catch (error) {
        logger.error('Email processing failed:', error);
        res.status(500).json({ error: 'Email processing failed' });
      }
    });

    // Customer Service AI - Website Chat
    router.post('/customer-service/website-chat', async (req, res) => {
      try {
        const { message, user_id, session_id } = req.body;
        
        if (!message) {
          return res.status(400).json({ error: 'Message required' });
        }

        const response = await this.aiAgentService.handleWebsiteChat(
          message, 
          user_id, 
          session_id
        );

        res.json(response);
      } catch (error) {
        logger.error('Website chat handling failed:', error);
        res.status(500).json({ error: 'Chat handling failed' });
      }
    });

    // Enhanced Drone Pilot AI - Advanced Mission Planning
    router.post('/drone-pilot/advanced-mission', async (req, res) => {
      try {
        const { mission_type, area, priority, weather_conditions } = req.body;
        
        if (!mission_type || !area) {
          return res.status(400).json({ error: 'Mission type and area required' });
        }

        const mission = await this.aiAgentService.generateAdvancedDroneMission({
          mission_type,
          area,
          priority,
          weather_conditions
        });

        res.json(mission);
      } catch (error) {
        logger.error('Advanced drone mission planning failed:', error);
        res.status(500).json({ error: 'Mission planning failed' });
      }
    });

    // Enhanced Content Creation Agent - Social Media Optimization
    router.post('/content-creation/social-media-optimization', async (req, res) => {
      try {
        const { content_id, platform, content_type, target_audience } = req.body;
        
        if (!content_id) {
          return res.status(400).json({ error: 'Content ID required' });
        }

        const optimization = await this.aiAgentService.optimizeContentForSocialMedia({
          content_id,
          platform,
          content_type,
          target_audience
        });

        res.json(optimization);
      } catch (error) {
        logger.error('Social media optimization failed:', error);
        res.status(500).json({ error: 'Optimization failed' });
      }
    });

    // Enhanced Content Creation Agent - Trend Analysis
    router.post('/content-creation/trend-analysis', async (req, res) => {
      try {
        const { industry, platform, timeframe } = req.body;
        
        const trends = await this.aiAgentService.analyzeContentTrends(industry || 'agriculture');

        res.json(trends);
      } catch (error) {
        logger.error('Trend analysis failed:', error);
        res.status(500).json({ error: 'Trend analysis failed' });
      }
    });

    // Enhanced Content Creation Agent - Hashtag Optimization
    router.post('/content-creation/hashtag-optimization', async (req, res) => {
      try {
        const { content_type, platform, target_audience, industry } = req.body;
        
        // Simulate hashtag optimization
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 500));
        
        const hashtags = {
          primary: ['#farming', '#agriculture', '#drone', '#orchard', '#nature'],
          trending: ['#farmlife', '#sustainable', '#organic', '#harvest', '#spring'],
          niche: ['#appleorchard', '#pearorchard', '#precisionfarming', '#agtech', '#rural'],
          engagement: ['#beautiful', '#amazing', '#incredible', '#stunning', '#wow'],
          platform_specific: platform === 'instagram' ? ['#reels', '#igtv', '#explore'] : 
                             platform === 'tiktok' ? ['#fyp', '#viral', '#trending'] : 
                             ['#shorts', '#trending', '#viral']
        };

        res.json({
          hashtags,
          confidence: 0.94 + Math.random() * 0.06,
          recommendations: [
            'Use 15-20 hashtags for Instagram',
            'Focus on trending hashtags for TikTok',
            'Mix popular and niche hashtags',
            'Update hashtags weekly based on trends'
          ]
        });
      } catch (error) {
        logger.error('Hashtag optimization failed:', error);
        res.status(500).json({ error: 'Hashtag optimization failed' });
      }
    });

    // Enhanced Content Creation Agent - Posting Time Optimization
    router.post('/content-creation/posting-time-optimization', async (req, res) => {
      try {
        const { platform, target_audience, content_type, timezone } = req.body;
        
        // Simulate posting time analysis
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
        
        const optimalTimes = {
          instagram: {
            best_days: ['Tuesday', 'Wednesday', 'Thursday', 'Saturday'],
            best_hours: ['09:00-11:00', '18:00-21:00'],
            peak_engagement: '18:00-21:00',
            frequency: '1-2 posts per day'
          },
          tiktok: {
            best_days: ['Monday', 'Tuesday', 'Thursday', 'Friday'],
            best_hours: ['19:00-22:00', '12:00-14:00'],
            peak_engagement: '19:00-22:00',
            frequency: '2-3 posts per day'
          },
          youtube: {
            best_days: ['Wednesday', 'Thursday', 'Friday'],
            best_hours: ['14:00-17:00', '19:00-21:00'],
            peak_engagement: '14:00-17:00',
            frequency: '2-3 posts per week'
          }
        };

        res.json({
          platform_times: optimalTimes[platform] || optimalTimes.instagram,
          general_recommendations: [
            'Post during peak engagement hours',
            'Maintain consistent posting schedule',
            'Test different times and analyze performance',
            'Consider your audience\'s timezone',
            'Use analytics to optimize timing'
          ],
          confidence: 0.91 + Math.random() * 0.09
        });
      } catch (error) {
        logger.error('Posting time optimization failed:', error);
        res.status(500).json({ error: 'Timing optimization failed' });
      }
    });

    // CrewAI-like collaboration routes
    router.post('/crew/collaboration', async (req, res) => {
      try {
        const collaborationData = req.body;
        
        if (!collaborationData.title || !collaborationData.agents) {
          return res.status(400).json({ error: 'Collaboration title and agents required' });
        }

        const collaboration = await this.aiAgentService.initiateCrewCollaboration(collaborationData);
        res.json(collaboration);
      } catch (error) {
        logger.error('Crew collaboration initiation failed:', error);
        res.status(500).json({ error: 'Collaboration initiation failed' });
      }
    });

    router.get('/crew/status', async (req, res) => {
      try {
        const status = await this.aiAgentService.getCrewStatus();
        res.json(status);
      } catch (error) {
        logger.error('Crew status retrieval failed:', error);
        res.status(500).json({ error: 'Status retrieval failed' });
      }
    });

    router.post('/crew/decision', async (req, res) => {
      try {
        const decisionData = req.body;
        
        if (!decisionData.agents || !decisionData.context) {
          return res.status(400).json({ error: 'Agents and context required' });
        }

        const decision = await this.aiAgentService.executeMultiAgentDecision(decisionData);
        res.json(decision);
      } catch (error) {
        logger.error('Multi-agent decision failed:', error);
        res.status(500).json({ error: 'Decision execution failed' });
      }
    });

    // Knowledge management routes
    router.post('/knowledge/share', async (req, res) => {
      try {
        const knowledgeData = req.body;
        
        if (!knowledgeData.sourceAgent || !knowledgeData.targetAgents) {
          return res.status(400).json({ error: 'Source and target agents required' });
        }

        const knowledgeShare = await this.aiAgentService.shareKnowledge(knowledgeData);
        res.json(knowledgeShare);
      } catch (error) {
        logger.error('Knowledge sharing failed:', error);
        res.status(500).json({ error: 'Knowledge sharing failed' });
      }
    });

    router.get('/memory/:agentId?', async (req, res) => {
      try {
        const { agentId } = req.params;
        const memory = await this.aiAgentService.getAgentMemory(agentId);
        res.json(memory);
      } catch (error) {
        logger.error('Memory retrieval failed:', error);
        res.status(500).json({ error: 'Memory retrieval failed' });
      }
    });

    // Crisis management routes
    router.post('/crisis/response', async (req, res) => {
      try {
        const crisisData = req.body;
        
        if (!crisisData.type || !crisisData.severity) {
          return res.status(400).json({ error: 'Crisis type and severity required' });
        }

        const crisisResponse = await this.aiAgentService.initiateCrisisResponse(crisisData);
        res.json(crisisResponse);
      } catch (error) {
        logger.error('Crisis response initiation failed:', error);
        res.status(500).json({ error: 'Crisis response failed' });
      }
    });

    // Workflow status routes
    router.get('/workflows/status', async (req, res) => {
      try {
        const status = await this.aiAgentService.getWorkflowStatus();
        res.json(status);
      } catch (error) {
        logger.error('Workflow status retrieval failed:', error);
        res.status(500).json({ error: 'Status retrieval failed' });
      }
    });

    // Health check endpoint
    router.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        agents: {
          'crop-health-monitor': 'ready',
          'irrigation-optimizer': 'ready',
          'predictive-maintenance': 'ready',
          'farm-analytics': 'ready',
          'weather-intelligence': 'ready',
          'computer-vision': 'ready',
          'drone-pilot-ai': 'ready',
          'content-creation-agent': 'ready',
          'customer-service-agent': 'ready'
        },
        timestamp: new Date().toISOString()
      });
    });

    return router;
  }
}

module.exports = AIAgentRoutes;
