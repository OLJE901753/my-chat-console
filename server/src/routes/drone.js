const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../database/init');
const logger = require('../utils/logger');

// Get drone status
router.get('/status', (req, res) => {
  try {
    // This would typically come from the drone service
    // For now, return a mock status
    const status = {
      connected: true,
      battery: 85,
      altitude: 0,
      speed: 0,
      temperature: 25,
      position: { x: 0, y: 0, z: 0 },
      orientation: { yaw: 0, pitch: 0, roll: 0 },
      lastUpdate: new Date().toISOString()
    };
    
    res.json({ success: true, data: status });
  } catch (error) {
    logger.error('Error getting drone status:', error);
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
    logger.info(`Drone command received: ${command}`, { params });
    
    // In a real implementation, this would be sent to the drone service
    // For now, simulate the command execution
    const result = await simulateCommandExecution(command, params);
    
    // Log the result
    logger.info(`Command executed successfully: ${command}`, { result });
    
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error executing drone command:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Takeoff
router.post('/takeoff', async (req, res) => {
  try {
    logger.info('Takeoff command received');
    
    // Simulate takeoff
    const result = await simulateCommandExecution('takeoff');
    
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error executing takeoff:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Land
router.post('/land', async (req, res) => {
  try {
    logger.info('Land command received');
    
    // Simulate landing
    const result = await simulateCommandExecution('land');
    
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error executing land:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Emergency stop
router.post('/emergency', async (req, res) => {
  try {
    logger.warn('EMERGENCY STOP command received');
    
    // Simulate emergency stop
    const result = await simulateCommandExecution('emergency');
    
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error executing emergency stop:', error);
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
    
    logger.info(`Move command received: ${direction} by ${distance}cm`);
    
    // Simulate movement
    const result = await simulateCommandExecution('move', { direction, distance });
    
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error executing move command:', error);
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
    
    logger.info(`Rotate command received: ${degrees} degrees`);
    
    // Simulate rotation
    const result = await simulateCommandExecution('rotate', { degrees });
    
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error executing rotate command:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Capture photo
router.post('/photo', async (req, res) => {
  try {
    logger.info('Photo capture command received');
    
    // Simulate photo capture
    const result = await simulateCommandExecution('capture_photo');
    
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error executing photo capture:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start recording
router.post('/recording/start', async (req, res) => {
  try {
    logger.info('Start recording command received');
    
    // Simulate recording start
    const result = await simulateCommandExecution('start_recording');
    
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error executing start recording:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Stop recording
router.post('/recording/stop', async (req, res) => {
  try {
    logger.info('Stop recording command received');
    
    // Simulate recording stop
    const result = await simulateCommandExecution('stop_recording');
    
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error executing stop recording:', error);
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
    
    logger.info(`Set speed command received: ${speed} cm/s`);
    
    // Simulate speed change
    const result = await simulateCommandExecution('set_speed', { speed });
    
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error executing set speed command:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get command history
router.get('/commands', async (req, res) => {
  try {
    const db = getDatabase();
    const { limit = 50, offset = 0 } = req.query;
    
    db.all(`
      SELECT * FROM drone_commands 
      ORDER BY timestamp DESC 
      LIMIT ? OFFSET ?
    `, [limit, offset], (err, rows) => {
      if (err) {
        logger.error('Error fetching command history:', err);
        return res.status(500).json({ success: false, error: err.message });
      }
      
      res.json({ success: true, data: rows });
    });
  } catch (error) {
    logger.error('Error getting command history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get photos
router.get('/photos', async (req, res) => {
  try {
    const db = getDatabase();
    const { limit = 20, offset = 0 } = req.query;
    
    db.all(`
      SELECT * FROM drone_photos 
      ORDER BY timestamp DESC 
      LIMIT ? OFFSET ?
    `, [limit, offset], (err, rows) => {
      if (err) {
        logger.error('Error fetching photos:', err);
        return res.status(500).json({ success: false, error: err.message });
      }
      
      res.json({ success: true, data: rows });
    });
  } catch (error) {
    logger.error('Error getting photos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get recordings
router.get('/recordings', async (req, res) => {
  try {
    const db = getDatabase();
    const { limit = 20, offset = 0 } = req.query;
    
    db.all(`
      SELECT * FROM drone_recordings 
      ORDER BY start_time DESC 
      LIMIT ? OFFSET ?
    `, [limit, offset], (err, rows) => {
      if (err) {
        logger.error('Error fetching recordings:', err);
        return res.status(500).json({ success: false, error: err.message });
      }
      
      res.json({ success: true, data: rows });
    });
  } catch (error) {
    logger.error('Error getting recordings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Simulate command execution (replace with actual drone SDK calls)
async function simulateCommandExecution(command, params = {}) {
  return new Promise((resolve) => {
    setTimeout(() => {
      let result;
      
      switch (command) {
        case 'takeoff':
          result = { 
            success: true, 
            message: 'Takeoff successful', 
            altitude: 1.5 
          };
          break;
        case 'land':
          result = { 
            success: true, 
            message: 'Landing successful', 
            altitude: 0 
          };
          break;
        case 'emergency':
          result = { 
            success: true, 
            message: 'Emergency stop executed', 
            altitude: 0 
          };
          break;
        case 'move':
          result = { 
            success: true, 
            message: `Moved ${params.direction} by ${params.distance}cm`,
            newPosition: { x: 0, y: 0, z: 0 }
          };
          break;
        case 'rotate':
          result = { 
            success: true, 
            message: `Rotated by ${params.degrees} degrees`,
            newYaw: params.degrees
          };
          break;
        case 'capture_photo':
          result = { 
            success: true, 
            message: 'Photo captured successfully',
            photoId: uuidv4(),
            timestamp: new Date().toISOString()
          };
          break;
        case 'start_recording':
          result = { 
            success: true, 
            message: 'Recording started',
            recordingId: uuidv4(),
            timestamp: new Date().toISOString()
          };
          break;
        case 'stop_recording':
          result = { 
            success: true, 
            message: 'Recording stopped',
            recordingId: uuidv4(),
            duration: 5000
          };
          break;
        case 'set_speed':
          result = { 
            success: true, 
            message: `Speed set to ${params.speed}cm/s`,
            speed: params.speed
          };
          break;
        default:
          result = { 
            success: false, 
            error: `Unknown command: ${command}` 
          };
      }
      
      resolve(result);
    }, 1000); // Simulate 1 second delay
  });
}

module.exports = router;
