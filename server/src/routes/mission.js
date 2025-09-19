const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../database/init');
const logger = require('../utils/logger');

// Get all missions
router.get('/', async (req, res) => {
  try {
    const db = getDatabase();
    const { status, limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM missions';
    let params = [];
    
    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    db.all(query, params, (err, rows) => {
      if (err) {
        logger.error('Error fetching missions:', err);
        return res.status(500).json({ success: false, error: err.message });
      }
      
      res.json({ success: true, data: rows });
    });
  } catch (error) {
    logger.error('Error getting missions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get mission by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    db.get('SELECT * FROM missions WHERE id = ?', [id], (err, row) => {
      if (err) {
        logger.error('Error fetching mission:', err);
        return res.status(500).json({ success: false, error: err.message });
      }
      
      if (!row) {
        return res.status(404).json({ success: false, error: 'Mission not found' });
      }
      
      res.json({ success: true, data: row });
    });
  } catch (error) {
    logger.error('Error getting mission:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new mission
router.post('/', async (req, res) => {
  try {
    const { name, description, waypoints, scheduled_for } = req.body;
    
    if (!name || !waypoints || !Array.isArray(waypoints)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name and waypoints array are required' 
      });
    }
    
    const missionId = uuidv4();
    const now = new Date().toISOString();
    
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO missions (id, name, description, waypoints, status, created_at, updated_at, scheduled_for, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      missionId,
      name,
      description || '',
      JSON.stringify(waypoints),
      'pending',
      now,
      now,
      scheduled_for || null,
      'system' // In a real app, this would be the authenticated user
    );
    
    stmt.finalize();
    
    logger.info('Mission created successfully', { missionId, name });
    
    res.status(201).json({ 
      success: true, 
      data: { 
        id: missionId, 
        name, 
        description, 
        waypoints, 
        status: 'pending',
        created_at: now 
      } 
    });
  } catch (error) {
    logger.error('Error creating mission:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update mission
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, waypoints, status, scheduled_for } = req.body;
    
    const db = getDatabase();
    
    // Check if mission exists
    db.get('SELECT * FROM missions WHERE id = ?', [id], (err, row) => {
      if (err) {
        logger.error('Error checking mission:', err);
        return res.status(500).json({ success: false, error: err.message });
      }
      
      if (!row) {
        return res.status(404).json({ success: false, error: 'Mission not found' });
      }
      
      // Update mission
      const updateFields = [];
      const params = [];
      
      if (name !== undefined) {
        updateFields.push('name = ?');
        params.push(name);
      }
      
      if (description !== undefined) {
        updateFields.push('description = ?');
        params.push(description);
      }
      
      if (waypoints !== undefined) {
        updateFields.push('waypoints = ?');
        params.push(JSON.stringify(waypoints));
      }
      
      if (status !== undefined) {
        updateFields.push('status = ?');
        params.push(status);
      }
      
      if (scheduled_for !== undefined) {
        updateFields.push('scheduled_for = ?');
        params.push(scheduled_for);
      }
      
      if (updateFields.length === 0) {
        return res.status(400).json({ success: false, error: 'No fields to update' });
      }
      
      updateFields.push('updated_at = ?');
      params.push(new Date().toISOString());
      params.push(id);
      
      const updateQuery = `UPDATE missions SET ${updateFields.join(', ')} WHERE id = ?`;
      
      db.run(updateQuery, params, function(err) {
        if (err) {
          logger.error('Error updating mission:', err);
          return res.status(500).json({ success: false, error: err.message });
        }
        
        logger.info('Mission updated successfully', { missionId: id });
        
        res.json({ 
          success: true, 
          data: { 
            id, 
            updated: true,
            changes: this.changes 
          } 
        });
      });
    });
  } catch (error) {
    logger.error('Error updating mission:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete mission
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    db.run('DELETE FROM missions WHERE id = ?', [id], function(err) {
      if (err) {
        logger.error('Error deleting mission:', err);
        return res.status(500).json({ success: false, error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ success: false, error: 'Mission not found' });
      }
      
      logger.info('Mission deleted successfully', { missionId: id });
      
      res.json({ 
        success: true, 
        data: { 
          id, 
          deleted: true,
          changes: this.changes 
        } 
      });
    });
  } catch (error) {
    logger.error('Error deleting mission:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start mission
router.post('/:id/start', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    // Update mission status to in_progress
    db.run(`
      UPDATE missions 
      SET status = 'in_progress', started_at = ?, updated_at = ?
      WHERE id = ?
    `, [new Date().toISOString(), new Date().toISOString(), id], function(err) {
      if (err) {
        logger.error('Error starting mission:', err);
        return res.status(500).json({ success: false, error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ success: false, error: 'Mission not found' });
      }
      
      logger.info('Mission started successfully', { missionId: id });
      
      res.json({ 
        success: true, 
        data: { 
          id, 
          status: 'in_progress',
          started_at: new Date().toISOString()
        } 
      });
    });
  } catch (error) {
    logger.error('Error starting mission:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Complete mission
router.post('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    // Update mission status to completed
    db.run(`
      UPDATE missions 
      SET status = 'completed', completed_at = ?, updated_at = ?
      WHERE id = ?
    `, [new Date().toISOString(), new Date().toISOString(), id], function(err) {
      if (err) {
        logger.error('Error completing mission:', err);
        return res.status(500).json({ success: false, error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ success: false, error: 'Mission not found' });
      }
      
      logger.info('Mission completed successfully', { missionId: id });
      
      res.json({ 
        success: true, 
        data: { 
          id, 
          status: 'completed',
          completed_at: new Date().toISOString()
        } 
      });
    });
  } catch (error) {
    logger.error('Error completing mission:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get mission statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    // Get mission details and related flight logs
    db.get(`
      SELECT 
        m.*,
        COUNT(fl.id) as flight_count,
        AVG(fl.duration) as avg_duration,
        MAX(fl.max_altitude) as max_altitude,
        MAX(fl.max_speed) as max_speed
      FROM missions m
      LEFT JOIN flight_logs fl ON m.id = fl.mission_id
      WHERE m.id = ?
      GROUP BY m.id
    `, [id], (err, row) => {
      if (err) {
        logger.error('Error fetching mission stats:', err);
        return res.status(500).json({ success: false, error: err.message });
      }
      
      if (!row) {
        return res.status(404).json({ success: false, error: 'Mission not found' });
      }
      
      res.json({ success: true, data: row });
    });
  } catch (error) {
    logger.error('Error getting mission stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
