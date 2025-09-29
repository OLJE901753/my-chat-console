const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const supabasePersistence = require('../services/supabasePersistenceService');

// Get current telemetry data
router.get('/current', async (req, res) => {
  try {
    // This would typically come from the drone service
    // For now, return mock telemetry data
    const telemetry = {
      timestamp: new Date().toISOString(),
      position: { x: 0, y: 0, z: 0 },
      altitude: 0,
      speed: 0,
      battery: 85,
      temperature: 25,
      orientation: { yaw: 0, pitch: 0, roll: 0 },
      mission_id: null
    };
    
    res.json({ success: true, data: telemetry });
  } catch (error) {
    logger.error('Error getting current telemetry:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get telemetry history
router.get('/history', async (req, res) => {
  try {
    // TODO: Implement with Supabase when database is configured
    // For now, return mock data
    const mockHistory = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        position: { x: 0, y: 0, z: 0 },
        altitude: 0,
        speed: 0,
        battery: 85,
        temperature: 25,
        orientation: { yaw: 0, pitch: 0, roll: 0 },
        mission_id: null
      }
    ];
    
    res.json({ success: true, data: mockHistory });
  } catch (error) {
    logger.error('Error getting telemetry history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save telemetry data point
// Ingest sensor/telemetry datapoint from devices
router.post('/', async (req, res) => {
  try {
    const payload = req.body || {};

    // Basic shape validation; devices can post arbitrary sensor keys
    if (typeof payload !== 'object') {
      return res.status(400).json({ success: false, error: 'Invalid payload' });
    }

    const telemetryId = uuidv4();
    const timestamp = new Date().toISOString();

    // Broadcast to WebSocket listeners as generic sensor_readings
    try {
      const websocketService = require('../services/websocketService');
      websocketService.broadcast({
        type: 'sensor_readings',
        data: { ...payload, timestamp },
        timestamp
      });
    } catch (e) {
      logger.warn('Telemetry broadcast failed', e);
    }

    // Persist to Supabase
    const persistenceData = {
      id: telemetryId,
      sensor_type: payload.sensor_type || 'generic',
      location: payload.location || 'Unknown',
      data: payload,
      timestamp: timestamp
    };
    
    await supabasePersistence.persistSensorReading(persistenceData);
    logger.debug('Telemetry ingested and persisted', { telemetryId, timestamp });

    res.status(201).json({ success: true, data: { id: telemetryId, timestamp, ...payload } });
  } catch (error) {
    logger.error('Error saving telemetry data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get telemetry statistics
router.get('/stats', async (req, res) => {
  try {
    // TODO: Implement with Supabase when database is configured
    // For now, return mock stats
    const mockStats = {
      total_points: 100,
      first_timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      last_timestamp: new Date().toISOString(),
      avg_altitude: 50,
      max_altitude: 100,
      min_altitude: 0,
      avg_speed: 5,
      max_speed: 15,
      min_speed: 0,
      avg_battery: 75,
      min_battery: 50,
      avg_temperature: 25,
      max_temperature: 30,
      min_temperature: 20
    };
    
    res.json({ success: true, data: mockStats });
  } catch (error) {
    logger.error('Error getting telemetry stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get real-time telemetry stream (SSE)
router.get('/stream', async (req, res) => {
  try {
    // Set headers for Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });
    
    // Send initial connection message
    res.write('data: {"type": "connected", "message": "Telemetry stream connected"}\n\n');
    
    // In a real implementation, this would subscribe to real-time telemetry updates
    // For now, we'll send mock data every second
    const interval = setInterval(() => {
      const mockTelemetry = {
        type: 'telemetry_update',
        timestamp: new Date().toISOString(),
        position: { x: 0, y: 0, z: 0 },
        altitude: 0,
        speed: 0,
        battery: 85,
        temperature: 25,
        orientation: { yaw: 0, pitch: 0, roll: 0 }
      };
      
      res.write(`data: ${JSON.stringify(mockTelemetry)}\n\n`);
    }, 1000);
    
    // Handle client disconnect
    req.on('close', () => {
      clearInterval(interval);
      logger.info('Telemetry stream disconnected');
    });
    
  } catch (error) {
    logger.error('Error setting up telemetry stream:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get telemetry data for specific time range
router.get('/range', async (req, res) => {
  try {
    const { start_time, end_time, resolution = '1m' } = req.query;
    
    if (!start_time || !end_time) {
      return res.status(400).json({ 
        success: false, 
        error: 'Start time and end time are required' 
      });
    }
    
    // TODO: Implement with Supabase when database is configured
    // For now, return mock range data
    const mockRangeData = [
      {
        time_bucket: new Date().toISOString(),
        avg_altitude: 50,
        max_altitude: 60,
        min_altitude: 40,
        avg_speed: 5,
        max_speed: 8,
        min_speed: 2,
        avg_battery: 75,
        min_battery: 70,
        avg_temperature: 25,
        max_temperature: 27,
        min_temperature: 23,
        data_points: 10
      }
    ];
    
    res.json({ success: true, data: mockRangeData });
  } catch (error) {
    logger.error('Error getting telemetry range:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export telemetry data
router.get('/export', async (req, res) => {
  try {
    const { 
      start_time, 
      end_time, 
      mission_id, 
      format = 'json' 
    } = req.query;
    
    if (!start_time || !end_time) {
      return res.status(400).json({ 
        success: false, 
        error: 'Start time and end time are required' 
      });
    }
    
    // TODO: Implement with Supabase when database is configured
    // For now, return mock export data
    const mockExportData = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        position: JSON.stringify({ x: 0, y: 0, z: 0 }),
        altitude: 50,
        speed: 5,
        battery: 75,
        temperature: 25,
        orientation: JSON.stringify({ yaw: 0, pitch: 0, roll: 0 }),
        mission_id: mission_id || null
      }
    ];
    
    if (format === 'csv') {
      // Convert to CSV format
      const csvHeaders = 'timestamp,position_x,position_y,position_z,altitude,speed,battery,temperature,yaw,pitch,roll,mission_id\n';
      const csvData = mockExportData.map(row => {
        const pos = JSON.parse(row.position);
        const orient = JSON.parse(row.orientation);
        return `${row.timestamp},${pos.x},${pos.y},${pos.z},${row.altitude},${row.speed},${row.battery},${row.temperature},${orient.yaw},${orient.pitch},${orient.roll},${row.mission_id || ''}`;
      }).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="telemetry_${start_time}_${end_time}.csv"`);
      res.send(csvHeaders + csvData);
    } else {
      // Return JSON format
      res.json({ success: true, data: mockExportData });
    }
  } catch (error) {
    logger.error('Error exporting telemetry data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
