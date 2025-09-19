# Drone Media Integration with Supabase

## Overview

This document describes the complete integration of drone media (photos and videos) with Supabase, enabling farm agents to access drone footage through a secure, role-based system.

## Architecture

### Components

1. **SupabaseMediaService** (`server/src/services/supabaseMediaService.js`)
   - Handles all media uploads to Supabase Storage
   - Manages media metadata in Supabase Database
   - Provides secure access control and signed URLs

2. **DroneMediaLibrary** (`src/components/DroneMediaLibrary.tsx`)
   - Frontend component for browsing and viewing drone media
   - Includes search, filtering, and media player functionality
   - Integrates with the Supabase media API

3. **Supabase API Routes** (`server/src/routes/supabase.js`)
   - Backend endpoints for media retrieval and management
   - Handles authentication and access control
   - Provides download functionality with signed URLs

4. **Database Schema** (`supabase/drone_media_schema.sql`)
   - Defines tables for drone videos, photos, and access control
   - Implements Row Level Security (RLS) policies
   - Includes audit logging and storage statistics

## Features

### Media Storage
- **Automatic Upload**: Photos and videos are automatically saved to Supabase when captured by drones
- **Metadata Storage**: Rich metadata including GPS coordinates, altitude, camera settings, and tags
- **Access Control**: Role-based permissions (viewer, manager, admin) for media access
- **Secure Storage**: Private storage bucket with signed URL access

### Media Library
- **Grid View**: Visual grid layout for browsing media files
- **Advanced Filtering**: Search by filename, tags, date range, and media type
- **Media Player**: Built-in video player with custom controls
- **Download Support**: Secure download functionality with access validation
- **Storage Statistics**: Real-time storage usage and media counts

### Security Features
- **Row Level Security**: Database-level access control based on user roles
- **Signed URLs**: Time-limited, secure access to media files
- **Audit Logging**: Complete access trail for compliance and security
- **Role-Based Access**: Different permission levels for different user types

## Database Schema

### Tables

#### `drone_videos`
- Stores metadata for all drone video recordings
- Includes GPS coordinates, altitude, duration, and access levels
- Links to missions and drone IDs for tracking

#### `drone_photos`
- Stores metadata for all drone photo captures
- Includes camera settings, GPS coordinates, and access levels
- Links to missions and drone IDs for tracking

#### `farm_agents`
- Manages user roles and permissions for each farm
- Supports viewer, manager, and admin roles
- Enables granular access control

#### `media_access_logs`
- Audits all media access attempts
- Tracks who accessed what media and when
- Includes IP addresses and user agents for security

### Row Level Security Policies

- **Viewer Access**: Can see media marked as 'viewer' level
- **Manager Access**: Can see 'viewer' and 'manager' level media
- **Admin Access**: Can see all media and manage access levels
- **Farm Isolation**: Users can only access media from farms they're assigned to

## API Endpoints

### Media Retrieval
- `GET /api/supabase/media?farmId={id}` - Get all media for a farm
- `GET /api/supabase/storage-stats?farmId={id}` - Get storage statistics
- `GET /api/supabase/media/{mediaId}` - Get specific media details

### Media Access
- `GET /api/supabase/download?mediaId={id}&type={video|photo}` - Download media file
- `POST /api/supabase/upload` - Upload new media (for drone service integration)

### Health & Management
- `GET /api/supabase/health` - Service health check
- `DELETE /api/supabase/media/{mediaId}` - Delete media (admin only)

## Integration with Drone Service

### Automatic Media Saving
When drones capture photos or videos, the media is automatically:

1. **Saved Locally**: Metadata stored in SQLite database
2. **Uploaded to Supabase**: File uploaded to Supabase Storage
3. **Metadata Stored**: Complete metadata saved to Supabase Database
4. **Access Control**: Appropriate access levels applied based on mission type

### Media Capture Flow

#### Photo Capture
```javascript
// In droneService.js
async capturePhoto() {
  // 1. Capture photo
  const photoId = uuidv4();
  const timestamp = new Date();
  
  // 2. Save to local database
  await this.savePhotoMetadata(photoId, timestamp);
  
  // 3. Upload to Supabase
  await this.supabaseMedia.uploadDronePhoto(photoPath, metadata);
  
  return { success: true, photoId, timestamp };
}
```

#### Video Recording
```javascript
// In droneService.js
async stopRecording() {
  // 1. Stop recording
  const recording = this.droneStatus.recording;
  
  // 2. Save to local database
  await this.saveRecordingMetadata(recording.id, recording.startTime, new Date());
  
  // 3. Upload to Supabase
  await this.supabaseMedia.uploadDroneVideo(videoPath, metadata);
  
  return { success: true, recordingId: recording.id };
}
```

## Frontend Integration

### Dashboard Tab
The Media Library is integrated as a new tab in the main dashboard:

```tsx
<TabsContent value="media-library">
  <DroneMediaLibrary />
</TabsContent>
```

### Component Features
- **Responsive Grid**: Adapts to different screen sizes
- **Real-time Updates**: Shows current storage statistics
- **Interactive Media Player**: Custom video controls
- **Search & Filter**: Advanced filtering capabilities
- **Download Support**: Secure file downloads

## Security Considerations

### Access Control
- All media access is controlled by RLS policies
- Users can only access media from farms they're assigned to
- Access levels determine what media is visible

### Data Protection
- Media files are stored in private Supabase Storage buckets
- Public URLs are not exposed - only signed URLs with expiration
- All access attempts are logged for audit purposes

### Authentication
- API endpoints require proper authentication
- Agent IDs are validated against farm assignments
- Admin operations require elevated permissions

## Configuration

### Environment Variables
```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional: Customize storage settings
SUPABASE_STORAGE_BUCKET=drone-media
SUPABASE_FILE_SIZE_LIMIT=524288000  # 500MB
```

### Storage Bucket Settings
- **Privacy**: Private (no public access)
- **File Size Limit**: 500MB per file
- **Allowed Types**: Video, image, and binary files
- **Retention**: Configurable retention policies

## Usage Examples

### For Farm Workers
1. Navigate to the Media Library tab
2. Browse recent drone footage and photos
3. Use filters to find specific media
4. View media in the built-in player
5. Download media for offline review

### For Farm Managers
1. Access all media from assigned farms
2. Manage media access levels
3. Review audit logs
4. Monitor storage usage

### For Administrators
1. Full access to all media
2. Manage user roles and permissions
3. Delete media when necessary
4. Configure storage policies

## Troubleshooting

### Common Issues

#### Media Not Loading
- Check Supabase connection and credentials
- Verify RLS policies are properly configured
- Ensure user has access to the farm

#### Upload Failures
- Check file size limits
- Verify storage bucket exists
- Check service role key permissions

#### Access Denied Errors
- Verify user role assignments
- Check farm agent permissions
- Review RLS policy configuration

### Debug Mode
Enable detailed logging by setting:
```javascript
// In logger configuration
level: 'debug'
```

## Future Enhancements

### Planned Features
- **AI Media Analysis**: Automatic tagging and analysis of drone footage
- **Batch Operations**: Bulk media management and processing
- **Advanced Search**: AI-powered content search within media
- **Mobile App**: Native mobile application for field workers
- **Real-time Streaming**: Live drone video streaming capabilities

### Performance Optimizations
- **CDN Integration**: Global content delivery network
- **Image Optimization**: Automatic thumbnail generation
- **Video Compression**: Adaptive quality based on network conditions
- **Caching**: Intelligent caching strategies for frequently accessed media

## Support

For technical support or questions about the drone media integration:

1. Check the server logs for detailed error information
2. Verify Supabase configuration and credentials
3. Review RLS policy configuration
4. Check user role assignments and permissions

## Conclusion

The drone media integration with Supabase provides a robust, secure, and scalable solution for managing farm drone footage. With automatic uploads, role-based access control, and a comprehensive media library, farm agents can efficiently access and manage drone media while maintaining security and compliance requirements.
