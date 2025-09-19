const express = require('express');
const router = express.Router();
const { SupabaseMediaService } = require('../services/supabaseMediaService');
const logger = require('../utils/logger');

// Initialize the Supabase media service
const mediaService = new SupabaseMediaService();

// Get all media for a farm
router.get('/media', async (req, res) => {
  try {
    const { farmId } = req.query;
    const { agentId } = req.query; // This would come from authenticated user context
    
    if (!farmId) {
      return res.status(400).json({ error: 'Farm ID is required' });
    }

    // For now, we'll use a default agent ID - in production this would come from JWT token
    const defaultAgentId = agentId || '00000000-0000-0000-0000-000000000000';
    
    logger.info(`Fetching media for farm: ${farmId}, agent: ${defaultAgentId}`);

    // Get both videos and photos
    const [videos, photos] = await Promise.all([
      mediaService.getVideosForAgent(defaultAgentId, farmId, 'viewer'),
      mediaService.getPhotosForAgent(defaultAgentId, farmId, 'viewer')
    ]);

    // Combine and format the media
    const allMedia = [
      ...videos.map(video => ({
        ...video,
        media_type: 'video',
        recorded_at: video.recorded_at
      })),
      ...photos.map(photo => ({
        ...photo,
        media_type: 'photo',
        recorded_at: photo.captured_at
      }))
    ];

    // Sort by recorded date (newest first)
    allMedia.sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at));

    res.json({
      success: true,
      media: allMedia,
      count: allMedia.length
    });

  } catch (error) {
    logger.error('Error fetching media:', error);
    res.status(500).json({ 
      error: 'Failed to fetch media',
      details: error.message 
    });
  }
});

// Get storage statistics for a farm
router.get('/storage-stats', async (req, res) => {
  try {
    const { farmId } = req.query;
    
    if (!farmId) {
      return res.status(400).json({ error: 'Farm ID is required' });
    }

    logger.info(`Fetching storage stats for farm: ${farmId}`);

    const stats = await mediaService.getStorageStats(farmId);

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    logger.error('Error fetching storage stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch storage stats',
      details: error.message 
    });
  }
});

// Download media file
router.get('/download', async (req, res) => {
  try {
    const { mediaId, type } = req.query;
    const { agentId } = req.query; // This would come from authenticated user context
    
    if (!mediaId || !type) {
      return res.status(400).json({ error: 'Media ID and type are required' });
    }

    // For now, we'll use a default agent ID - in production this would come from JWT token
    const defaultAgentId = agentId || '00000000-0000-0000-0000-000000000000';
    
    logger.info(`Download request for media: ${mediaId}, type: ${type}, agent: ${defaultAgentId}`);

    let signedUrl;
    if (type === 'video') {
      signedUrl = await mediaService.getSignedVideoUrl(mediaId, defaultAgentId, 3600); // 1 hour expiry
    } else if (type === 'photo') {
      signedUrl = await mediaService.getSignedPhotoUrl(mediaId, defaultAgentId, 3600); // 1 hour expiry
    } else {
      return res.status(400).json({ error: 'Invalid media type' });
    }

    if (!signedUrl) {
      return res.status(403).json({ error: 'Access denied to this media' });
    }

    // Redirect to the signed URL for download
    res.redirect(signedUrl);

  } catch (error) {
    logger.error('Error generating download URL:', error);
    res.status(500).json({ 
      error: 'Failed to generate download URL',
      details: error.message 
    });
  }
});

// Upload drone media (for drone service integration)
router.post('/upload', async (req, res) => {
  try {
    const { mediaType, metadata } = req.body;
    
    if (!mediaType || !metadata) {
      return res.status(400).json({ error: 'Media type and metadata are required' });
    }

    // This endpoint would typically receive the actual file via multipart/form-data
    // For now, we'll simulate the upload process
    logger.info(`Upload request for ${mediaType} with metadata:`, metadata);

    // In a real implementation, you would:
    // 1. Receive the file via multer or similar middleware
    // 2. Validate the file type and size
    // 3. Call the appropriate upload method on the media service
    // 4. Return the uploaded media information

    res.json({
      success: true,
      message: 'Upload endpoint ready - file handling to be implemented',
      metadata
    });

  } catch (error) {
    logger.error('Error in upload endpoint:', error);
    res.status(500).json({ 
      error: 'Upload failed',
      details: error.message 
    });
  }
});

// Get media by ID
router.get('/media/:mediaId', async (req, res) => {
  try {
    const { mediaId } = req.params;
    const { agentId } = req.query;
    
    if (!mediaId) {
      return res.status(400).json({ error: 'Media ID is required' });
    }

    // For now, we'll use a default agent ID - in production this would come from JWT token
    const defaultAgentId = agentId || '00000000-0000-0000-0000-000000000000';
    
    logger.info(`Fetching media details for: ${mediaId}, agent: ${defaultAgentId}`);

    // This would need to be implemented in the media service
    // For now, return a placeholder response
    res.json({
      success: true,
      message: 'Media details endpoint ready - implementation pending',
      mediaId,
      agentId: defaultAgentId
    });

  } catch (error) {
    logger.error('Error fetching media details:', error);
    res.status(500).json({ 
      error: 'Failed to fetch media details',
      details: error.message 
    });
  }
});

// Delete media (admin only)
router.delete('/media/:mediaId', async (req, res) => {
  try {
    const { mediaId } = req.params;
    const { agentId } = req.body;
    
    if (!mediaId || !agentId) {
      return res.status(400).json({ error: 'Media ID and agent ID are required' });
    }
    
    logger.info(`Delete request for media: ${mediaId} by agent: ${agentId}`);

    // Check if agent has admin access
    if (!mediaService.hasAdminAccess(agentId)) {
      return res.status(403).json({ error: 'Admin access required to delete media' });
    }

    // Determine media type and delete accordingly
    // This would need to be implemented based on how you identify media types
    // For now, return a placeholder response
    res.json({
      success: true,
      message: 'Delete endpoint ready - implementation pending',
      mediaId,
      deletedBy: agentId
    });

  } catch (error) {
    logger.error('Error deleting media:', error);
    res.status(500).json({ 
      error: 'Failed to delete media',
      details: error.message 
    });
  }
});

// Health check for Supabase media service
router.get('/health', async (req, res) => {
  try {
    // Check if the media service can connect to Supabase
    const isHealthy = await mediaService.checkHealth();
    
    res.json({
      success: true,
      service: 'Supabase Media Service',
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({ 
      success: false,
      service: 'Supabase Media Service',
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
