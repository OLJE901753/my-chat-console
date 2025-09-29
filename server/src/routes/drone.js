const express = require('express');
const router = express.Router();
const SupabaseService = require('../services/supabaseService');
const TelloDroneService = require('../services/telloDroneService');

// Initialize services
const supabaseService = new SupabaseService();
const droneService = new TelloDroneService();
const { v4: uuidv4 } = require('uuid');

// Export droneService for use in other modules
module.exports.droneService = droneService;

const logger = require('../utils/logger');

// Get drone status
router.get('/status', (req, res) => {
  try {
    // Get real status from Tello drone service
    const status = droneService.getStatus();
    
    logger.info('📊 Drone status requested:', status);
    res.json({ success: true, data: status });
  } catch (error) {
    logger.error('❌ Error getting drone status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Execute drone command
router.post('/command', async (req, res) => {
  try {
    const { command, params } = req.body;
    
    if (!command) {
      return res.status(400).json({ success: false, error: 'Command is required' });
    }
    
    // Log the command
    logger.info(`📤 Drone command received: ${command}`, { params });
    
    // Execute real command using Tello drone service
    const result = await executeRealCommand(command, params);
    
    // Log the result
    logger.info(`✅ Command executed successfully: ${command}`, { result });
    
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error(`❌ Error executing drone command: ${command}`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Takeoff
router.post('/takeoff', async (req, res) => {
  try {
    logger.info('🚁 Takeoff command received');
    
    // Execute real takeoff
    const result = await droneService.takeoff();
    
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('❌ Error executing takeoff:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Land
router.post('/land', async (req, res) => {
  try {
    logger.info('🛬 Land command received');
    
    // Execute real landing
    const result = await droneService.land();
    
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('❌ Error executing land:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Emergency stop
router.post('/emergency', async (req, res) => {
  try {
    logger.warn('🚨 EMERGENCY STOP command received');
    
    // Execute real emergency stop
    const result = await droneService.emergency();
    
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('❌ Error executing emergency stop:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Move drone
router.post('/move', async (req, res) => {
  try {
    const { direction, distance } = req.body;
    
    if (!direction || !distance) {
      return res.status(400).json({ 
        success: false, 
        error: 'Direction and distance are required' 
      });
    }
    
    logger.info(`📤 Move command received: ${direction} by ${distance}cm`);
    
    // Execute real movement
    const result = await droneService.move(direction, distance);
    
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error(`❌ Error executing move command: ${direction} ${distance}cm`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Rotate drone
router.post('/rotate', async (req, res) => {
  try {
    const { degrees } = req.body;
    
    if (!degrees) {
      return res.status(400).json({ 
        success: false, 
        error: 'Degrees are required' 
      });
    }
    
    logger.info(`🔄 Rotate command received: ${degrees} degrees`);
    
    // Execute real rotation
    const result = await droneService.rotate(degrees);
    
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error(`❌ Error executing rotate command: ${degrees} degrees`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Capture photo
router.post('/photo', async (req, res) => {
  try {
    logger.info('📸 Photo capture command received');
    
    // Execute real photo capture
    const result = await droneService.capturePhoto();
    
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('❌ Error executing photo capture:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start recording
router.post('/recording/start', async (req, res) => {
  try {
    logger.info('🎥 Start recording command received');
    
    // Execute real recording start
    const result = await droneService.startRecording();
    
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('❌ Error executing start recording:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Stop recording
router.post('/recording/stop', async (req, res) => {
  try {
    logger.info('⏹️ Stop recording command received');
    
    // Execute real recording stop
    const result = await droneService.stopRecording();
    
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('❌ Error executing stop recording:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Set speed
router.post('/speed', async (req, res) => {
  try {
    const { speed } = req.body;
    
    if (!speed || speed < 10 || speed > 100) {
      return res.status(400).json({ 
        success: false, 
        error: 'Speed must be between 10 and 100 cm/s' 
      });
    }
    
    logger.info(`⚡ Set speed command received: ${speed} cm/s`);
    
    // Execute real speed change
    const result = await droneService.setSpeed(speed);
    
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error(`❌ Error executing set speed command: ${speed} cm/s`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get command history
router.get('/commands', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const commands = await supabaseService.getDroneCommands(parseInt(limit), parseInt(offset));
    res.json({ success: true, data: commands });
  } catch (error) {
    logger.error('Error getting command history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get photos  
router.get('/photos', async (req, res) => {
  try {
    // Use mock data for now - photos will be handled by media service
    const photos = [
      {
        id: '1',
        filename: 'nessa_orchard_001.jpg',
        captured_at: new Date().toISOString(),
        location: { lat: 58.9, lng: 5.7 },
        tags: ['apple', 'orchard', 'health_check']
      }
    ];
    res.json({ success: true, data: photos });
  } catch (error) {
    logger.error('Error getting photos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get recordings
router.get('/recordings', async (req, res) => {
  try {
    // Use mock data for now - recordings will be handled by media service
    const recordings = [
      {
        id: '1',
        filename: 'nessa_flight_001.mp4',
        recorded_at: new Date().toISOString(),
        duration: 300,
        location: { lat: 58.9, lng: 5.7 },
        tags: ['surveillance', 'crop_monitoring']
      }
    ];
    res.json({ success: true, data: recordings });
  } catch (error) {
    logger.error('Error getting recordings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Connect to drone
router.post('/connect', async (req, res) => {
  try {
    logger.info('🔌 Connect to drone command received');
    
    const result = await droneService.connect();
    
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('❌ Error connecting to drone:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Disconnect from drone
router.post('/disconnect', async (req, res) => {
  try {
    logger.info('🔌 Disconnect from drone command received');
    
    const result = await droneService.disconnect();
    
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('❌ Error disconnecting from drone:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reconnect to drone
router.post('/reconnect', async (req, res) => {
  try {
    logger.info('🔄 Reconnect to drone command received');
    
    const result = await droneService.reconnect();
    
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('❌ Error reconnecting to drone:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Execute real drone command using TelloDroneService
async function executeRealCommand(command, params = {}) {
  try {
    switch (command) {
      case 'takeoff':
        return await droneService.takeoff();
      case 'land':
        return await droneService.land();
      case 'emergency':
        return await droneService.emergency();
      case 'move':
        return await droneService.move(params.direction, params.distance);
      case 'rotate':
        return await droneService.rotate(params.degrees);
      case 'capture_photo':
        return await droneService.capturePhoto();
      case 'start_recording':
        return await droneService.startRecording();
      case 'stop_recording':
        return await droneService.stopRecording();
      case 'set_speed':
        return await droneService.setSpeed(params.speed);
      default:
        // For unknown commands, try sending directly to drone
        const response = await droneService.sendCommand(command);
        return {
          success: true,
          message: `Command executed: ${command}`,
          response: response
        };
    }
  } catch (error) {
    throw error;
  }
}

module.exports = router;
