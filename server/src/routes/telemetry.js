const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../database/init');
const logger = require('../utils/logger');

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
    const db = getDatabase();
    const { 
      start_time, 
      end_time, 
      mission_id, 
      limit = 1000, 
      offset = 0 
    } = req.query;
    
    let query = 'SELECT * FROM telemetry_data';
    let params = [];
    let conditions = [];
    
    if (start_time) {
      conditions.push('timestamp >= ?');
      params.push(start_time);
    }
    
    if (end_time) {
      conditions.push('timestamp <= ?');
      params.push(end_time);
    }
    
    if (mission_id) {
      conditions.push('mission_id = ?');
      params.push(mission_id);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    db.all(query, params, (err, rows) => {
      if (err) {
        logger.error('Error fetching telemetry history:', err);
        return res.status(500).json({ success: false, error: err.message });
      }
      
      res.json({ success: true, data: rows });
    });
  } catch (error) {
    logger.error('Error getting telemetry history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save telemetry data point
router.post('/', async (req, res) => {
  try {
    const { 
      position, 
      altitude, 
      speed, 
      battery, 
      temperature, 
      orientation, 
      mission_id 
    } = req.body;
    
    if (!position || altitude === undefined || speed === undefined || 
        battery === undefined || temperature === undefined || !orientation) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required telemetry fields' 
      });
    }
    
    const telemetryId = uuidv4();
    const timestamp = new Date().toISOString();
    
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO telemetry_data (
        id, timestamp, position, altitude, speed, battery, 
        temperature, orientation, mission_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      telemetryId,
      timestamp,
      JSON.stringify(position),
      altitude,
      speed,
      battery,
      temperature,
      JSON.stringify(orientation),
      mission_id || null
    );
    
    stmt.finalize();
    
    logger.debug('Telemetry data saved', { telemetryId, timestamp });
    
    res.status(201).json({ 
      success: true, 
      data: { 
        id: telemetryId, 
        timestamp,
        position,
        altitude,
        speed,
        battery,
        temperature,
        orientation,
        mission_id
      } 
    });
  } catch (error) {
    logger.error('Error saving telemetry data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get telemetry statistics
router.get('/stats', async (req, res) => {
  try {
    const db = getDatabase();
    const { 
      start_time, 
      end_time, 
      mission_id 
    } = req.query;
    
    let query = `
      SELECT 
        COUNT(*) as total_points,
        MIN(timestamp) as first_timestamp,
        MAX(timestamp) as last_timestamp,
        AVG(altitude) as avg_altitude,
        MAX(altitude) as max_altitude,
        MIN(altitude) as min_altitude,
        AVG(speed) as avg_speed,
        MAX(speed) as max_speed,
        MIN(speed) as min_speed,
        AVG(battery) as avg_battery,
        MIN(battery) as min_battery,
        AVG(temperature) as avg_temperature,
        MAX(temperature) as max_temperature,
        MIN(temperature) as min_temperature
      FROM telemetry_data
    `;
    
    let params = [];
    let conditions = [];
    
    if (start_time) {
      conditions.push('timestamp >= ?');
      params.push(start_time);
    }
    
    if (end_time) {
      conditions.push('timestamp <= ?');
      params.push(end_time);
    }
    
    if (mission_id) {
      conditions.push('mission_id = ?');
      params.push(mission_id);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    db.get(query, params, (err, row) => {
      if (err) {
        logger.error('Error fetching telemetry stats:', err);
        return res.status(500).json({ success: false, error: err.message });
      }
      
      res.json({ success: true, data: row });
    });
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
    
    const db = getDatabase();
    
    // Convert resolution to seconds
    let intervalSeconds = 60; // default 1 minute
    switch (resolution) {
      case '10s':
        intervalSeconds = 10;
        break;
      case '30s':
        intervalSeconds = 30;
        break;
      case '1m':
        intervalSeconds = 60;
        break;
      case '5m':
        intervalSeconds = 300;
        break;
      case '15m':
        intervalSeconds = 900;
        break;
      case '1h':
        intervalSeconds = 3600;
        break;
    }
    
    // Query to get aggregated telemetry data
    const query = `
      SELECT 
        strftime('%Y-%m-%d %H:%M:%S', 
          datetime(timestamp, 'unixepoch', 'localtime')
        ) as time_bucket,
        AVG(altitude) as avg_altitude,
        MAX(altitude) as max_altitude,
        MIN(altitude) as min_altitude,
        AVG(speed) as avg_speed,
        MAX(speed) as max_speed,
        MIN(speed) as min_speed,
        AVG(battery) as avg_battery,
        MIN(battery) as min_battery,
        AVG(temperature) as avg_temperature,
        MAX(temperature) as max_temperature,
        MIN(temperature) as min_temperature,
        COUNT(*) as data_points
      FROM telemetry_data
      WHERE timestamp BETWEEN ? AND ?
      GROUP BY strftime('%Y-%m-%d %H:%M:%S', 
        datetime(timestamp, 'unixepoch', 'localtime')
      )
      ORDER BY time_bucket
    `;
    
    db.all(query, [start_time, end_time], (err, rows) => {
      if (err) {
        logger.error('Error fetching telemetry range:', err);
        return res.status(500).json({ success: false, error: err.message });
      }
      
      res.json({ success: true, data: rows });
    });
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
    
    const db = getDatabase();
    
    let query = 'SELECT * FROM telemetry_data';
    let params = [];
    let conditions = ['timestamp BETWEEN ? AND ?'];
    params.push(start_time, end_time);
    
    if (mission_id) {
      conditions.push('mission_id = ?');
      params.push(mission_id);
    }
    
    query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY timestamp';
    
    db.all(query, params, (err, rows) => {
      if (err) {
        logger.error('Error exporting telemetry data:', err);
        return res.status(500).json({ success: false, error: err.message });
      }
      
      if (format === 'csv') {
        // Convert to CSV format
        const csvHeaders = 'timestamp,position_x,position_y,position_z,altitude,speed,battery,temperature,yaw,pitch,roll,mission_id\n';
        const csvData = rows.map(row => {
          const pos = JSON.parse(row.position);
          const orient = JSON.parse(row.orientation);
          return `${row.timestamp},${pos.x},${pos.y},${pos.z},${row.altitude},${row.speed},${row.battery},${row.temperature},${orient.yaw},${orient.pitch},${orient.roll},${row.mission_id || ''}`;
        }).join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="telemetry_${start_time}_${end_time}.csv"`);
        res.send(csvHeaders + csvData);
      } else {
        // Return JSON format
        res.json({ success: true, data: rows });
      }
    });
  } catch (error) {
    logger.error('Error exporting telemetry data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
