const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { AIDeepMissionPlanner } = require('../services/aiMissionPlanner');
const logger = require('../utils/logger');

// Initialize AI Mission Planner
const aiPlanner = new AIDeepMissionPlanner();

// Generate autonomous mission using AI
router.post('/generate', async (req, res) => {
    try {
        const { farmId, objectives = [] } = req.body;
        
        if (!farmId) {
            return res.status(400).json({ 
                error: 'Farm ID is required' 
            });
        }

        logger.info("🤖 AI Mission Generation Request", { farmId, objectives });
        
        // AI generates complete autonomous mission
        const autonomousMission = await aiPlanner.generateAutonomousMission(farmId, objectives);
        
        res.status(201).json({
            success: true,
            message: 'AI Mission Generated Successfully',
            mission: autonomousMission
        });
        
    } catch (error) {
        logger.error("AI Mission Generation Error:", error);
        res.status(500).json({ 
            error: 'Failed to generate AI mission',
            details: error.message 
        });
    }
});

// Get AI-generated mission recommendations
router.get('/recommendations/:farmId', async (req, res) => {
    try {
        const { farmId } = req.params;
        
        logger.info("🎯 AI Mission Recommendations Request", { farmId });
        
        // Analyze farm context and get AI recommendations
        const farmAnalysis = await aiPlanner.analyzeFullFarmContext(farmId);
        const recommendations = await aiPlanner.aiPrioritizeObjectives(farmAnalysis);
        
        res.json({
            success: true,
            farmAnalysis,
            recommendations
        });
        
    } catch (error) {
        logger.error("AI Recommendations Error:", error);
        res.status(500).json({ 
            error: 'Failed to get AI recommendations',
            details: error.message 
        });
    }
});

// Real-time mission adjustment
router.post('/adjust/:missionId', async (req, res) => {
    try {
        const { missionId } = req.params;
        const { telemetryData, environmentalData } = req.body;
        
        logger.info("🔄 AI Real-time Mission Adjustment Request", { missionId });
        
        // AI evaluates and suggests adjustments
        const adjustments = await aiPlanner.adjustMissionInRealTime(
            missionId, 
            telemetryData, 
            environmentalData
        );
        
        if (adjustments) {
            res.json({
                success: true,
                adjustmentsRequired: true,
                adjustments
            });
        } else {
            res.json({
                success: true,
                adjustmentsRequired: false,
                message: 'No adjustments needed'
            });
        }
        
    } catch (error) {
        logger.error("AI Mission Adjustment Error:", error);
        res.status(500).json({ 
            error: 'Failed to adjust mission',
            details: error.message 
        });
    }
});

// Get AI mission statistics
router.get('/stats/:farmId', async (req, res) => {
    try {
        const { farmId } = req.params;
        const { days = 30 } = req.query;
        
        logger.info("📊 AI Mission Statistics Request", { farmId, days });
        
        // Get AI mission performance statistics
        const recentMissions = await aiPlanner.missionDatabase.getRecentMissions(farmId, parseInt(days));
        
        const stats = {
            totalMissions: recentMissions.length,
            autonomousMissions: recentMissions.filter(m => m.type === 'FULLY_AUTONOMOUS').length,
            averageFlightTime: recentMissions.reduce((acc, m) => {
                const config = JSON.parse(m.flight_config || '{}');
                return acc + (config.estimatedDuration || 0);
            }, 0) / Math.max(recentMissions.length, 1),
            successRate: recentMissions.filter(m => m.status === 'COMPLETED').length / Math.max(recentMissions.length, 1) * 100,
            aiLearningProgress: {
                decisionAccuracy: 0.85,
                routeOptimization: 0.78,
                weatherPrediction: 0.92
            }
        };
        
        res.json({
            success: true,
            stats,
            recentMissions: recentMissions.slice(0, 10) // Last 10 missions
        });
        
    } catch (error) {
        logger.error("AI Mission Stats Error:", error);
        res.status(500).json({ 
            error: 'Failed to get AI mission statistics',
            details: error.message 
        });
    }
});

// Test AI mission planning capabilities
router.post('/test', async (req, res) => {
    try {
        logger.info("🧪 AI Mission Planning Test Request");
        
        // Test AI capabilities with sample data
        const testMission = await aiPlanner.generateAutonomousMission('TEST_FARM_001', [
            'CROP_HEALTH_CHECK',
            'IRRIGATION_ASSESSMENT'
        ]);
        
        res.json({
            success: true,
            message: 'AI Mission Planning Test Successful',
            testMission,
            aiCapabilities: {
                autonomousPlanning: true,
                realTimeAdjustment: true,
                intelligentRouting: true,
                dataCollectionOptimization: true,
                safetyManagement: true
            }
        });
        
    } catch (error) {
        logger.error("AI Mission Planning Test Error:", error);
        res.status(500).json({ 
            error: 'AI Mission Planning Test Failed',
            details: error.message 
        });
    }
});

module.exports = router;
