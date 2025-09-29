const logger = require('../utils/logger');
const supabasePersistence = require('./supabasePersistenceService');
const { v4: uuidv4 } = require('uuid');

/**
 * Camera Feed Service
 * Manages camera feeds and integrates with content agent for video processing
 */
class CameraFeedService {
  constructor() {
    this.cameras = new Map(); // cameraId -> camera data
    this.activeFeeds = new Map(); // cameraId -> feed status
    this.contentAgentUrl = process.env.CONTENT_AGENT_URL || 'http://localhost:8030';
    this.websocketService = null;
  }

  /**
   * Set WebSocket service reference for broadcasting
   */
  setWebSocketService(websocketService) {
    this.websocketService = websocketService;
    logger.info('Camera feed service connected to WebSocket');
  }

  /**
   * Add a camera to the system
   */
  addCamera(cameraId, config) {
    const camera = {
      id: cameraId,
      name: config.name || `Camera ${cameraId}`,
      type: config.type || 'ip_camera', // 'ip_camera', 'usb_camera', 'drone_camera'
      streamUrl: config.streamUrl || null,
      location: config.location || { x: 0, y: 0, z: 0 },
      status: 'offline',
      lastSeen: null,
      capabilities: config.capabilities || ['video', 'photo'],
      settings: config.settings || {}
    };

    this.cameras.set(cameraId, camera);
    logger.info(`📹 Camera added: ${camera.name} (${cameraId})`);
    
    this.broadcastCameraUpdate(cameraId, 'added');
    return camera;
  }

  /**
   * Remove a camera from the system
   */
  removeCamera(cameraId) {
    if (this.cameras.has(cameraId)) {
      this.stopFeed(cameraId);
      this.cameras.delete(cameraId);
      logger.info(`📹 Camera removed: ${cameraId}`);
      this.broadcastCameraUpdate(cameraId, 'removed');
      return true;
    }
    return false;
  }

  /**
   * Get camera status
   */
  getCameraStatus(cameraId) {
    return this.cameras.get(cameraId) || null;
  }

  /**
   * Get all cameras
   */
  getAllCameras() {
    return Array.from(this.cameras.values());
  }

  /**
   * Start a camera feed
   */
  startFeed(cameraId) {
    const camera = this.cameras.get(cameraId);
    if (!camera) {
      throw new Error(`Camera ${cameraId} not found`);
    }

    if (this.activeFeeds.has(cameraId)) {
      logger.warn(`Feed already active for camera ${cameraId}`);
      return;
    }

    // Simulate feed start (in real implementation, this would connect to actual camera)
    const feed = {
      cameraId,
      status: 'active',
      startTime: new Date().toISOString(),
      frameCount: 0,
      lastFrame: null
    };

    this.activeFeeds.set(cameraId, feed);
    camera.status = 'online';
    camera.lastSeen = new Date().toISOString();

    logger.info(`📹 Feed started for camera ${camera.name}`);
    this.broadcastCameraUpdate(cameraId, 'feed_started');

    // Simulate frame processing
    this.startFrameProcessing(cameraId);
  }

  /**
   * Stop a camera feed
   */
  stopFeed(cameraId) {
    const feed = this.activeFeeds.get(cameraId);
    if (!feed) {
      return;
    }

    this.activeFeeds.delete(cameraId);
    
    const camera = this.cameras.get(cameraId);
    if (camera) {
      camera.status = 'offline';
    }

    logger.info(`📹 Feed stopped for camera ${cameraId}`);
    this.broadcastCameraUpdate(cameraId, 'feed_stopped');
  }

  /**
   * Capture photo from camera
   */
  async capturePhoto(cameraId) {
    const camera = this.cameras.get(cameraId);
    if (!camera) {
      throw new Error(`Camera ${cameraId} not found`);
    }

    if (!this.activeFeeds.has(cameraId)) {
      throw new Error(`Camera ${cameraId} feed not active`);
    }

    // Simulate photo capture
    const photo = {
      id: uuidv4(),
      cameraId,
      timestamp: new Date().toISOString(),
      filename: `photo_${cameraId}_${Date.now()}.jpg`,
      location: camera.location,
      metadata: {
        camera: camera.name,
        settings: camera.settings
      }
    };

    logger.info(`📸 Photo captured from camera ${camera.name}`);
    this.broadcastCameraUpdate(cameraId, 'photo_captured', photo);
    
    return photo;
  }

  /**
   * Start video recording
   */
  async startRecording(cameraId, duration = 60) {
    const camera = this.cameras.get(cameraId);
    if (!camera) {
      throw new Error(`Camera ${cameraId} not found`);
    }

    if (!this.activeFeeds.has(cameraId)) {
      throw new Error(`Camera ${cameraId} feed not active`);
    }

    const recording = {
      id: uuidv4(),
      cameraId,
      startTime: new Date().toISOString(),
      duration,
      status: 'recording',
      filename: `video_${cameraId}_${Date.now()}.mp4`,
      location: camera.location,
      metadata: {
        camera: camera.name,
        settings: camera.settings
      }
    };

    logger.info(`🎥 Recording started on camera ${camera.name} for ${duration}s`);
    this.broadcastCameraUpdate(cameraId, 'recording_started', recording);

    // Simulate recording completion
    setTimeout(() => {
      this.stopRecording(cameraId, recording.id);
    }, duration * 1000);

    return recording;
  }

  /**
   * Stop video recording
   */
  async stopRecording(cameraId, recordingId) {
    const camera = this.cameras.get(cameraId);
    if (!camera) {
      throw new Error(`Camera ${cameraId} not found`);
    }

    const recording = {
      id: recordingId,
      cameraId,
      endTime: new Date().toISOString(),
      status: 'completed',
      filename: `video_${cameraId}_${Date.now()}.mp4`,
      location: camera.location
    };

    logger.info(`🎥 Recording stopped on camera ${camera.name}`);
    this.broadcastCameraUpdate(cameraId, 'recording_stopped', recording);

    // Process video with content agent
    await this.processVideoWithContentAgent(recording);

    return recording;
  }

  /**
   * Process video with content agent
   */
  async processVideoWithContentAgent(recording) {
    try {
      logger.info(`🎬 Processing video ${recording.filename} with content agent`);
      
      // In a real implementation, this would upload the video to the content agent
      // For now, we'll simulate the processing
      const processingResult = {
        recordingId: recording.id,
        status: 'processing',
        clips: [],
        contentSuggestions: {},
        processingTime: 0
      };

      // Simulate processing delay
      setTimeout(() => {
        processingResult.status = 'completed';
        processingResult.clips = [
          {
            platform: 'youtube',
            duration: 30,
            quality_score: 0.85,
            description: 'Farm overview clip'
          },
          {
            platform: 'instagram',
            duration: 15,
            quality_score: 0.92,
            description: 'Crop close-up clip'
          },
          {
            platform: 'tiktok',
            duration: 10,
            quality_score: 0.78,
            description: 'Quick farm tour'
          }
        ];
        processingResult.processingTime = 15.5;

        this.broadcastCameraUpdate(recording.cameraId, 'video_processed', processingResult);
        logger.info(`✅ Video processing completed for ${recording.filename}`);
      }, 2000);

    } catch (error) {
      logger.error(`❌ Video processing failed: ${error.message}`);
      this.broadcastCameraUpdate(recording.cameraId, 'video_processing_failed', { error: error.message });
    }
  }

  /**
   * Start frame processing simulation
   */
  startFrameProcessing(cameraId) {
    const interval = setInterval(() => {
      const feed = this.activeFeeds.get(cameraId);
      if (!feed) {
        clearInterval(interval);
        return;
      }

      feed.frameCount++;
      feed.lastFrame = new Date().toISOString();

      // Broadcast frame update every 30 frames (simulate 1 FPS)
      if (feed.frameCount % 30 === 0) {
        this.broadcastCameraUpdate(cameraId, 'frame_update', {
          frameCount: feed.frameCount,
          timestamp: feed.lastFrame
        });
      }
    }, 1000); // 1 second intervals
  }

  /**
   * Broadcast camera update via WebSocket
   */
  async broadcastCameraUpdate(cameraId, eventType, data = null) {
    if (!this.websocketService) {
      return;
    }

    const camera = this.cameras.get(cameraId);
    const timestamp = new Date().toISOString();
    const message = {
      type: 'camera_update',
      data: {
        cameraId,
        eventType,
        camera: camera ? {
          id: camera.id,
          name: camera.name,
          status: camera.status,
          lastSeen: camera.lastSeen
        } : null,
        data,
        timestamp: timestamp
      },
      timestamp: timestamp
    };

    // Persist camera event to Supabase
    await supabasePersistence.persistCameraEvent({
      cameraId,
      eventType,
      camera: camera ? {
        id: camera.id,
        name: camera.name,
        status: camera.status,
        lastSeen: camera.lastSeen
      } : null,
      data,
      timestamp: timestamp
    });

    this.websocketService.broadcast(message);
  }

  /**
   * Get system status
   */
  getStatus() {
    return {
      totalCameras: this.cameras.size,
      activeFeeds: this.activeFeeds.size,
      cameras: Array.from(this.cameras.values()).map(camera => ({
        id: camera.id,
        name: camera.name,
        status: camera.status,
        lastSeen: camera.lastSeen,
        capabilities: camera.capabilities
      }))
    };
  }
}

module.exports = new CameraFeedService();
