const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class SupabaseMediaService {
    constructor() {
        // Initialize Supabase client for media storage
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.warn('Supabase environment variables not configured. Media service will be disabled.');
            this.supabase = null;
            this.bucketName = 'drone-media';
            return;
        }
        
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for backend operations
        );
        
        this.bucketName = 'drone-media';
        this.initializeBucket();
    }

    async initializeBucket() {
        try {
            if (!this.supabase) {
                console.warn('Supabase not configured, skipping bucket initialization');
                return;
            }
            
            // Create drone media bucket if it doesn't exist
            const { data: buckets } = await this.supabase.storage.listBuckets();
            const bucketExists = buckets.some(bucket => bucket.name === this.bucketName);
            
            if (!bucketExists) {
                const { data, error } = await this.supabase.storage.createBucket(this.bucketName, {
                    public: false, // Private bucket for security
                    fileSizeLimit: 524288000, // 500MB file limit
                    allowedMimeTypes: ['video/*', 'image/*', 'application/octet-stream']
                });
                
                if (error) {
                    logger.error('Failed to create Supabase bucket:', error);
                } else {
                    logger.info('Supabase drone media bucket created successfully');
                }
            }
        } catch (error) {
            logger.error('Error initializing Supabase bucket:', error);
        }
    }

    // Upload drone video footage to Supabase
    async uploadDroneVideo(videoFile, metadata) {
        try {
            if (!this.supabase) {
                console.warn('Supabase not configured, skipping video upload');
                return { success: false, message: 'Supabase not configured' };
            }
            
            const videoId = uuidv4();
            const fileName = `videos/${videoId}_${Date.now()}.mp4`;
            
            // Read video file
            const videoBuffer = fs.readFileSync(videoFile);
            
            // Upload to Supabase Storage
            const { data, error } = await this.supabase.storage
                .from(this.bucketName)
                .upload(fileName, videoBuffer, {
                    contentType: 'video/mp4',
                    metadata: {
                        droneId: metadata.droneId,
                        missionId: metadata.missionId,
                        timestamp: metadata.timestamp,
                        duration: metadata.duration,
                        location: metadata.location,
                        altitude: metadata.altitude
                    }
                });

            if (error) {
                logger.error('Failed to upload video to Supabase:', error);
                throw error;
            }

            // Get public URL (or signed URL for private access)
            const { data: urlData } = this.supabase.storage
                .from(this.bucketName)
                .getPublicUrl(fileName);

            // Save video metadata to Supabase database
            const videoRecord = {
                id: videoId,
                filename: fileName,
                public_url: urlData.publicUrl,
                file_size: videoBuffer.length,
                duration: metadata.duration,
                drone_id: metadata.droneId,
                mission_id: metadata.missionId,
                recorded_at: metadata.timestamp,
                location: metadata.location,
                altitude: metadata.altitude,
                tags: metadata.tags || [],
                farm_id: metadata.farmId,
                agent_access_level: metadata.agentAccessLevel || 'viewer',
                created_at: new Date().toISOString()
            };

            const { error: dbError } = await this.supabase
                .from('drone_videos')
                .insert(videoRecord);

            if (dbError) {
                logger.error('Failed to save video metadata to database:', dbError);
                // Clean up uploaded file if metadata save fails
                await this.supabase.storage.from(this.bucketName).remove([fileName]);
                throw dbError;
            }

            logger.info('Drone video uploaded to Supabase successfully', { videoId, fileName });
            
            return {
                videoId,
                fileName,
                publicUrl: urlData.publicUrl,
                fileSize: videoBuffer.length,
                metadata: videoRecord
            };

        } catch (error) {
            logger.error('Error uploading drone video:', error);
            throw error;
        }
    }

    // Upload drone photos to Supabase
    async uploadDronePhoto(photoFile, metadata) {
        try {
            if (!this.supabase) {
                console.warn('Supabase not configured, skipping photo upload');
                return { success: false, message: 'Supabase not configured' };
            }
            
            const photoId = uuidv4();
            const fileName = `photos/${photoId}_${Date.now()}.jpg`;
            
            // Read photo file
            const photoBuffer = fs.readFileSync(photoFile);
            
            // Upload to Supabase Storage
            const { data, error } = await this.supabase.storage
                .from(this.bucketName)
                .upload(fileName, photoBuffer, {
                    contentType: 'image/jpeg',
                    metadata: {
                        droneId: metadata.droneId,
                        missionId: metadata.missionId,
                        timestamp: metadata.timestamp,
                        location: metadata.location,
                        altitude: metadata.altitude,
                        cameraSettings: metadata.cameraSettings
                    }
                });

            if (error) {
                logger.error('Failed to upload photo to Supabase:', error);
                throw error;
            }

            // Get public URL
            const { data: urlData } = this.supabase.storage
                .from(this.bucketName)
                .getPublicUrl(fileName);

            // Save photo metadata to Supabase database
            const photoRecord = {
                id: photoId,
                filename: fileName,
                public_url: urlData.publicUrl,
                file_size: photoBuffer.length,
                drone_id: metadata.droneId,
                mission_id: metadata.missionId,
                captured_at: metadata.timestamp,
                location: metadata.location,
                altitude: metadata.altitude,
                camera_settings: metadata.cameraSettings,
                tags: metadata.tags || [],
                farm_id: metadata.farmId,
                agent_access_level: metadata.agentAccessLevel || 'viewer',
                created_at: new Date().toISOString()
            };

            const { error: dbError } = await this.supabase
                .from('drone_photos')
                .insert(photoRecord);

            if (dbError) {
                logger.error('Failed to save photo metadata to database:', dbError);
                // Clean up uploaded file if metadata save fails
                await this.supabase.storage.from(this.bucketName).remove([fileName]);
                throw dbError;
            }

            logger.info('Drone photo uploaded to Supabase successfully', { photoId, fileName });
            
            return {
                photoId,
                fileName,
                publicUrl: urlData.publicUrl,
                fileSize: photoBuffer.length,
                metadata: photoRecord
            };

        } catch (error) {
            logger.error('Error uploading drone photo:', error);
            throw error;
        }
    }

    // Get videos accessible to a specific farm agent
    async getVideosForAgent(agentId, farmId, accessLevel = 'viewer') {
        try {
            let query = this.supabase
                .from('drone_videos')
                .select('*')
                .eq('farm_id', farmId);

            // Apply access level filtering
            if (accessLevel === 'viewer') {
                query = query.eq('agent_access_level', 'viewer');
            } else if (accessLevel === 'manager') {
                query = query.in('agent_access_level', ['viewer', 'manager']);
            } else if (accessLevel === 'admin') {
                // Admins can see all videos
            }

            const { data, error } = await query.order('recorded_at', { ascending: false });

            if (error) {
                logger.error('Failed to fetch videos for agent:', error);
                throw error;
            }

            return data;

        } catch (error) {
            logger.error('Error getting videos for agent:', error);
            throw error;
        }
    }

    // Get photos accessible to a specific farm agent
    async getPhotosForAgent(agentId, farmId, accessLevel = 'viewer') {
        try {
            let query = this.supabase
                .from('drone_photos')
                .select('*')
                .eq('farm_id', farmId);

            // Apply access level filtering
            if (accessLevel === 'viewer') {
                query = query.eq('agent_access_level', 'viewer');
            } else if (accessLevel === 'manager') {
                query = query.in('agent_access_level', ['viewer', 'manager']);
            } else if (accessLevel === 'admin') {
                // Admins can see all photos
            }

            const { data, error } = await query.order('captured_at', { ascending: false });

            if (error) {
                logger.error('Failed to fetch photos for agent:', error);
                throw error;
            }

            return data;

        } catch (error) {
            logger.error('Error getting photos for agent:', error);
            throw error;
        }
    }

    // Generate signed URL for secure video access
    async getSignedVideoUrl(videoId, agentId, expiresIn = 3600) {
        try {
            // Get video metadata
            const { data: video, error } = await this.supabase
                .from('drone_videos')
                .select('filename, agent_access_level')
                .eq('id', videoId)
                .single();

            if (error || !video) {
                throw new Error('Video not found');
            }

            // Check access permissions
            if (video.agent_access_level === 'private' && !this.hasAdminAccess(agentId)) {
                throw new Error('Access denied');
            }

            // Generate signed URL
            const { data, error: urlError } = await this.supabase.storage
                .from(this.bucketName)
                .createSignedUrl(video.filename, expiresIn);

            if (urlError) {
                throw urlError;
            }

            return data.signedUrl;

        } catch (error) {
            logger.error('Error generating signed video URL:', error);
            throw error;
        }
    }

    // Generate signed URL for secure photo access
    async getSignedPhotoUrl(photoId, agentId, expiresIn = 3600) {
        try {
            // Get photo metadata
            const { data: photo, error } = await this.supabase
                .from('drone_photos')
                .select('filename, agent_access_level')
                .eq('id', photoId)
                .single();

            if (error || !photo) {
                throw new Error('Photo not found');
            }

            // Check access permissions
            if (photo.agent_access_level === 'private' && !this.hasAdminAccess(agentId)) {
                throw new Error('Access denied');
            }

            // Generate signed URL
            const { data, error: urlError } = await this.supabase.storage
                .from(this.bucketName)
                .createSignedUrl(photo.filename, expiresIn);

            if (urlError) {
                throw urlError;
            }

            return data.signedUrl;

        } catch (error) {
            logger.error('Error generating signed photo URL:', error);
            throw error;
        }
    }

    // Delete video (admin only)
    async deleteVideo(videoId, adminId) {
        try {
            if (!this.hasAdminAccess(adminId)) {
                throw new Error('Admin access required');
            }

            // Get video metadata
            const { data: video, error } = await this.supabase
                .from('drone_videos')
                .select('filename')
                .eq('id', videoId)
                .single();

            if (error || !video) {
                throw new Error('Video not found');
            }

            // Delete from storage
            const { error: storageError } = await this.supabase.storage
                .from(this.bucketName)
                .remove([video.filename]);

            if (storageError) {
                logger.error('Failed to delete video from storage:', storageError);
            }

            // Delete metadata from database
            const { error: dbError } = await this.supabase
                .from('drone_videos')
                .delete()
                .eq('id', videoId);

            if (dbError) {
                throw dbError;
            }

            logger.info('Video deleted successfully', { videoId });

        } catch (error) {
            logger.error('Error deleting video:', error);
            throw error;
        }
    }

    // Delete photo (admin only)
    async deletePhoto(photoId, adminId) {
        try {
            if (!this.hasAdminAccess(adminId)) {
                throw new Error('Admin access required');
            }

            // Get photo metadata
            const { data: photo, error } = await this.supabase
                .from('drone_photos')
                .select('filename')
                .eq('id', photoId)
                .single();

            if (error || !photo) {
                throw new Error('Photo not found');
            }

            // Delete from storage
            const { error: storageError } = await this.supabase.storage
                .from(this.bucketName)
                .remove([photo.filename]);

            if (storageError) {
                logger.error('Failed to delete photo from storage:', storageError);
            }

            // Delete metadata from database
            const { error: dbError } = await this.supabase
                .from('drone_photos')
                .delete()
                .eq('id', photoId);

            if (dbError) {
                throw dbError;
            }

            logger.info('Photo deleted successfully', { photoId });

        } catch (error) {
            logger.error('Error deleting photo:', error);
            throw error;
        }
    }

    // Helper method to check admin access
    hasAdminAccess(agentId) {
        // This would integrate with your existing user management system
        // For now, return true - implement proper role checking
        return true;
    }

    // Get storage usage statistics
    async getStorageStats(farmId) {
        try {
            const { data: videos, error: videoError } = await this.supabase
                .from('drone_videos')
                .select('file_size')
                .eq('farm_id', farmId);

            if (videoError) throw videoError;

            const { data: photos, error: photoError } = await this.supabase
                .from('drone_photos')
                .select('file_size')
                .eq('farm_id', farmId);

            if (photoError) throw photoError;

            const totalVideoSize = videos.reduce((sum, v) => sum + (v.file_size || 0), 0);
            const totalPhotoSize = photos.reduce((sum, p) => sum + (p.file_size || 0), 0);

            return {
                total_videos: videos.length,
                total_photos: photos.length,
                total_video_size: totalVideoSize,
                total_photo_size: totalPhotoSize,
                total_size: totalVideoSize + totalPhotoSize
            };
        } catch (error) {
            logger.error('Error getting storage stats:', error);
            throw error;
        }
    }

    async checkHealth() {
        try {
            // Simple health check - try to query a small amount of data
            const { data, error } = await this.supabase
                .from('drone_videos')
                .select('id')
                .limit(1);

            if (error) throw error;
            
            return true;
        } catch (error) {
            logger.error('Supabase health check failed:', error);
            return false;
        }
    }
}

module.exports = { SupabaseMediaService };
