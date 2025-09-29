import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Video, 
  Play, 
  Square, 
  Plus, 
  Trash2, 
  Settings,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCameraFeeds } from '@/hooks/useRealtimeData';
import { useToast } from '@/hooks/use-toast';

interface CameraData {
  id: string;
  name: string;
  type: string;
  status: 'online' | 'offline';
  lastSeen: string | null;
  capabilities: string[];
}

interface CameraManagerProps {
  className?: string;
}

const CameraManager: React.FC<CameraManagerProps> = ({ className = '' }) => {
  const [cameras, setCameras] = useState<CameraData[]>([]);
  const [loading, setLoading] = useState(false);
  const [newCamera, setNewCamera] = useState({
    id: '',
    name: '',
    type: 'ip_camera',
    streamUrl: ''
  });
  const { toast } = useToast();
  const { data: cameraUpdate, isLive } = useCameraFeeds();

  // Load cameras on mount
  useEffect(() => {
    loadCameras();
  }, []);

  // Handle real-time camera updates
  useEffect(() => {
    if (cameraUpdate) {
      handleCameraUpdate(cameraUpdate);
    }
  }, [cameraUpdate]);

  const loadCameras = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cameras');
      const result = await response.json();
      
      if (result.success) {
        setCameras(result.data);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to load cameras:', error);
      toast({
        title: 'Error',
        description: 'Failed to load cameras',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCameraUpdate = (update: any) => {
    const { cameraId, eventType, camera, data } = update;
    
    switch (eventType) {
      case 'added':
        if (camera) {
          setCameras(prev => [...prev, camera]);
          toast({
            title: 'Camera Added',
            description: `${camera.name} has been added`,
          });
        }
        break;
        
      case 'removed':
        setCameras(prev => prev.filter(c => c.id !== cameraId));
        toast({
          title: 'Camera Removed',
          description: `Camera ${cameraId} has been removed`,
        });
        break;
        
      case 'feed_started':
        setCameras(prev => prev.map(c => 
          c.id === cameraId ? { ...c, status: 'online' as const } : c
        ));
        toast({
          title: 'Feed Started',
          description: `Camera ${cameraId} feed is now active`,
        });
        break;
        
      case 'feed_stopped':
        setCameras(prev => prev.map(c => 
          c.id === cameraId ? { ...c, status: 'offline' as const } : c
        ));
        toast({
          title: 'Feed Stopped',
          description: `Camera ${cameraId} feed has been stopped`,
        });
        break;
        
      case 'photo_captured':
        toast({
          title: 'Photo Captured',
          description: `Photo captured from camera ${cameraId}`,
        });
        break;
        
      case 'recording_started':
        toast({
          title: 'Recording Started',
          description: `Recording started on camera ${cameraId}`,
        });
        break;
        
      case 'recording_stopped':
        toast({
          title: 'Recording Stopped',
          description: `Recording stopped on camera ${cameraId}`,
        });
        break;
        
      case 'video_processed':
        toast({
          title: 'Video Processed',
          description: `Video from camera ${cameraId} has been processed`,
        });
        break;
    }
  };

  const addCamera = async () => {
    if (!newCamera.id || !newCamera.name) {
      toast({
        title: 'Error',
        description: 'Camera ID and name are required',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetch('/api/cameras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCamera)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setNewCamera({ id: '', name: '', type: 'ip_camera', streamUrl: '' });
        toast({
          title: 'Success',
          description: 'Camera added successfully',
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to add camera:', error);
      toast({
        title: 'Error',
        description: 'Failed to add camera',
        variant: 'destructive'
      });
    }
  };

  const removeCamera = async (cameraId: string) => {
    try {
      const response = await fetch(`/api/cameras/${cameraId}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Camera removed successfully',
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to remove camera:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove camera',
        variant: 'destructive'
      });
    }
  };

  const startFeed = async (cameraId: string) => {
    try {
      const response = await fetch(`/api/cameras/${cameraId}/feed/start`, {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Camera feed started',
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to start feed:', error);
      toast({
        title: 'Error',
        description: 'Failed to start camera feed',
        variant: 'destructive'
      });
    }
  };

  const stopFeed = async (cameraId: string) => {
    try {
      const response = await fetch(`/api/cameras/${cameraId}/feed/stop`, {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Camera feed stopped',
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to stop feed:', error);
      toast({
        title: 'Error',
        description: 'Failed to stop camera feed',
        variant: 'destructive'
      });
    }
  };

  const capturePhoto = async (cameraId: string) => {
    try {
      const response = await fetch(`/api/cameras/${cameraId}/capture`, {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Photo captured successfully',
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to capture photo:', error);
      toast({
        title: 'Error',
        description: 'Failed to capture photo',
        variant: 'destructive'
      });
    }
  };

  const startRecording = async (cameraId: string) => {
    try {
      const response = await fetch(`/api/cameras/${cameraId}/record/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration: 60 })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Recording started',
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast({
        title: 'Error',
        description: 'Failed to start recording',
        variant: 'destructive'
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'offline':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge variant="default" className="bg-green-500">Online</Badge>;
      case 'offline':
        return <Badge variant="destructive">Offline</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Add Camera Form */}
      <Card className="glass-card border-blue-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Camera
          </CardTitle>
          <CardDescription>
            Add a new camera to the system for monitoring and recording
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cameraId">Camera ID</Label>
              <Input
                id="cameraId"
                value={newCamera.id}
                onChange={(e) => setNewCamera(prev => ({ ...prev, id: e.target.value }))}
                placeholder="camera_001"
              />
            </div>
            <div>
              <Label htmlFor="cameraName">Camera Name</Label>
              <Input
                id="cameraName"
                value={newCamera.name}
                onChange={(e) => setNewCamera(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Main Field Camera"
              />
            </div>
            <div>
              <Label htmlFor="cameraType">Type</Label>
              <select
                id="cameraType"
                value={newCamera.type}
                onChange={(e) => setNewCamera(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="ip_camera">IP Camera</option>
                <option value="usb_camera">USB Camera</option>
                <option value="drone_camera">Drone Camera</option>
              </select>
            </div>
            <div>
              <Label htmlFor="streamUrl">Stream URL (Optional)</Label>
              <Input
                id="streamUrl"
                value={newCamera.streamUrl}
                onChange={(e) => setNewCamera(prev => ({ ...prev, streamUrl: e.target.value }))}
                placeholder="rtsp://192.168.1.100:554/stream"
              />
            </div>
          </div>
          <Button onClick={addCamera} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Camera
          </Button>
        </CardContent>
      </Card>

      {/* Camera List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cameras.map((camera) => (
          <Card key={camera.id} className="glass-card border-lime-500/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  {camera.name}
                </CardTitle>
                {getStatusIcon(camera.status)}
              </div>
              <CardDescription>
                {camera.type} • {camera.id}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                {getStatusBadge(camera.status)}
                <span className="text-sm text-gray-500">
                  {camera.lastSeen ? new Date(camera.lastSeen).toLocaleTimeString() : 'Never'}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startFeed(camera.id)}
                    disabled={camera.status === 'online'}
                    className="flex-1"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Start
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => stopFeed(camera.id)}
                    disabled={camera.status === 'offline'}
                    className="flex-1"
                  >
                    <Square className="h-4 w-4 mr-1" />
                    Stop
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => capturePhoto(camera.id)}
                    disabled={camera.status === 'offline'}
                    className="flex-1"
                  >
                    <Camera className="h-4 w-4 mr-1" />
                    Photo
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startRecording(camera.id)}
                    disabled={camera.status === 'offline'}
                    className="flex-1"
                  >
                    <Video className="h-4 w-4 mr-1" />
                    Record
                  </Button>
                </div>

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => removeCamera(camera.id)}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>

              <div className="text-xs text-gray-500">
                Capabilities: {camera.capabilities.join(', ')}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {cameras.length === 0 && !loading && (
        <Card className="glass-card border-gray-500/30">
          <CardContent className="text-center py-8">
            <Camera className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Cameras</h3>
            <p className="text-gray-500">Add your first camera to get started with monitoring and recording.</p>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card className="glass-card border-gray-500/30">
          <CardContent className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading cameras...</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CameraManager;
