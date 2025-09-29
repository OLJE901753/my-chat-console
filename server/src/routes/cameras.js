const express = require('express');
const router = express.Router();
const cameraFeedService = require('../services/cameraFeedService');
const logger = require('../utils/logger');

// Get all cameras
router.get('/', (req, res) => {
  try {
    const cameras = cameraFeedService.getAllCameras();
    res.json({ success: true, data: cameras });
  } catch (error) {
    logger.error('Error getting cameras:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get camera status
router.get('/:cameraId/status', (req, res) => {
  try {
    const { cameraId } = req.params;
    const camera = cameraFeedService.getCameraStatus(cameraId);
    
    if (!camera) {
      return res.status(404).json({ success: false, error: 'Camera not found' });
    }
    
    res.json({ success: true, data: camera });
  } catch (error) {
    logger.error('Error getting camera status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add camera
router.post('/', (req, res) => {
  try {
    const { cameraId, ...config } = req.body;
    
    if (!cameraId) {
      return res.status(400).json({ success: false, error: 'Camera ID is required' });
    }
    
    const camera = cameraFeedService.addCamera(cameraId, config);
    res.status(201).json({ success: true, data: camera });
  } catch (error) {
    logger.error('Error adding camera:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove camera
router.delete('/:cameraId', (req, res) => {
  try {
    const { cameraId } = req.params;
    const removed = cameraFeedService.removeCamera(cameraId);
    
    if (!removed) {
      return res.status(404).json({ success: false, error: 'Camera not found' });
    }
    
    res.json({ success: true, message: 'Camera removed' });
  } catch (error) {
    logger.error('Error removing camera:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start camera feed
router.post('/:cameraId/feed/start', (req, res) => {
  try {
    const { cameraId } = req.params;
    cameraFeedService.startFeed(cameraId);
    res.json({ success: true, message: 'Feed started' });
  } catch (error) {
    logger.error('Error starting feed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Stop camera feed
router.post('/:cameraId/feed/stop', (req, res) => {
  try {
    const { cameraId } = req.params;
    cameraFeedService.stopFeed(cameraId);
    res.json({ success: true, message: 'Feed stopped' });
  } catch (error) {
    logger.error('Error stopping feed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Capture photo
router.post('/:cameraId/capture', (req, res) => {
  try {
    const { cameraId } = req.params;
    const photo = cameraFeedService.capturePhoto(cameraId);
    res.json({ success: true, data: photo });
  } catch (error) {
    logger.error('Error capturing photo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start recording
router.post('/:cameraId/record/start', (req, res) => {
  try {
    const { cameraId } = req.params;
    const { duration = 60 } = req.body;
    const recording = cameraFeedService.startRecording(cameraId, duration);
    res.json({ success: true, data: recording });
  } catch (error) {
    logger.error('Error starting recording:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Stop recording
router.post('/:cameraId/record/stop', (req, res) => {
  try {
    const { cameraId } = req.params;
    const { recordingId } = req.body;
    const recording = cameraFeedService.stopRecording(cameraId, recordingId);
    res.json({ success: true, data: recording });
  } catch (error) {
    logger.error('Error stopping recording:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get system status
router.get('/system/status', (req, res) => {
  try {
    const status = cameraFeedService.getStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    logger.error('Error getting system status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
