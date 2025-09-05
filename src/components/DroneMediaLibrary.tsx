import { 
  Camera, 
  Clock, 
  Download, 
  Eye, 
  HardDrive,
  Maximize,
  Pause,
  Play,
  Tag,
  Video,
  Volume2,
  VolumeX
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface DroneMedia {
  id: string;
  filename: string;
  public_url: string;
  file_size: number;
  media_type: 'video' | 'photo';
  recorded_at: string;
  location: { lat: number; lng: number } | null;
  altitude: number;
  tags: string[];
  access_level: string;
  duration?: number;
  camera_settings?: Record<string, unknown>;
}

interface StorageStats {
  total_videos: number;
  total_photos: number;
  total_video_size: number;
  total_photo_size: number;
  total_size: number;
}

const DroneMediaLibrary: React.FC = () => {
  const { toast } = useToast();
  const [media, setMedia] = useState<DroneMedia[]>([]);
  const [filteredMedia, setFilteredMedia] = useState<DroneMedia[]>([]);
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedMedia, setSelectedMedia] = useState<DroneMedia | null>(null);
  const [videoPlayer, setVideoPlayer] = useState<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.max(1, Math.ceil(filteredMedia.length / pageSize));

  const farmId = 'FARM_001'; // This would come from user context

  // Define async callbacks before effects to avoid TDZ errors
  const loadMedia = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/supabase/media?farmId=${farmId}`);
      if (response.ok) {
        const data = await response.json();
        setMedia(data.media || []);
      } else {
        throw new Error('Failed to load media');
      }
    } catch {
      toast({
        title: "Error Loading Media",
        description: "Failed to load drone media from Supabase",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [farmId, toast]);

  const loadStorageStats = useCallback(async () => {
    try {
      const response = await fetch(`/api/supabase/storage-stats?farmId=${farmId}`);
      if (response.ok) {
        const data = await response.json();
        setStorageStats(data.stats);
      }
    } catch {
      toast({
        title: 'Error Loading Storage Stats',
        description: 'Failed to load storage usage from Supabase',
        variant: 'destructive'
      });
    }
  }, [farmId]);

  useEffect(() => {
    loadMedia();
    loadStorageStats();
  }, [loadMedia, loadStorageStats]);

  useEffect(() => {
    let filtered = [...media];

    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter(item => 
        item.tags.some(tag => selectedTags.includes(tag))
      );
    }

    if (dateRange.start) {
      filtered = filtered.filter(item => 
        new Date(item.recorded_at) >= new Date(dateRange.start)
      );
    }
    if (dateRange.end) {
      filtered = filtered.filter(item => 
        new Date(item.recorded_at) <= new Date(dateRange.end)
      );
    }

    setFilteredMedia(filtered);
    setPage(1);
  }, [media, searchTerm, selectedTags, dateRange]);

  // (filter logic handled in effect above)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMediaSelect = (mediaItem: DroneMedia) => {
    setSelectedMedia(mediaItem);
    if (mediaItem.media_type === 'video') {
      // Reset video player state
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    }
  };

  const handleVideoPlay = () => {
    if (videoPlayer) {
      if (isPlaying) {
        videoPlayer.pause();
      } else {
        videoPlayer.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVideoMute = () => {
    if (videoPlayer) {
      videoPlayer.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVideoSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoPlayer) {
      videoPlayer.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVideoTimeUpdate = () => {
    if (videoPlayer) {
      setCurrentTime(videoPlayer.currentTime);
    }
  };

  const handleVideoLoadedMetadata = () => {
    if (videoPlayer) {
      setDuration(videoPlayer.duration);
    }
  };

  const handleVideoError = () => {
    toast({
      title: 'Video Error',
      description: 'Failed to load the selected video',
      variant: 'destructive'
    });
  };

  const downloadMedia = async (mediaItem: DroneMedia) => {
    try {
      const response = await fetch(`/api/supabase/download?mediaId=${mediaItem.id}&type=${mediaItem.media_type}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = mediaItem.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Download Started",
          description: `${mediaItem.media_type} download initiated`,
        });
      }
    } catch {
      toast({
        title: "Download Failed",
        description: "Failed to download media file",
        variant: "destructive"
      });
    }
  };

  const getAllTags = () => {
    const tags = new Set<string>();
    media.forEach(item => {
      item.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-card border-lime-500/30">
        <CardHeader>
          <CardTitle className="gradient-text text-2xl flex items-center gap-2">
            <Video className="w-8 h-8 text-lime-400" />
            Drone Media Library
          </CardTitle>
          <CardDescription className="text-gray-300">
            Access and manage drone video footage and photos stored in Supabase
          </CardDescription>
        </CardHeader>
        <CardContent>
          {storageStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-lime-500/10 rounded border border-lime-500/20">
                <Video className="w-6 h-6 text-lime-400 mx-auto mb-2" />
                <div className="text-lg font-semibold text-lime-400">{storageStats.total_videos}</div>
                <div className="text-sm text-gray-300">Videos</div>
              </div>
              <div className="text-center p-3 bg-lime-500/10 rounded border border-lime-500/20">
                <Camera className="w-6 h-6 text-lime-400 mx-auto mb-2" />
                <div className="text-lg font-semibold text-lime-400">{storageStats.total_photos}</div>
                <div className="text-sm text-gray-300">Photos</div>
              </div>
              <div className="text-center p-3 bg-lime-500/10 rounded border border-lime-500/20">
                <HardDrive className="w-6 h-6 text-lime-400 mx-auto mb-2" />
                <div className="text-lg font-semibold text-lime-400">{formatFileSize(storageStats.total_size)}</div>
                <div className="text-sm text-gray-300">Total Size</div>
              </div>
              <div className="text-center p-3 bg-lime-500/10 rounded border border-lime-500/20">
                <Tag className="w-6 h-6 text-lime-400 mx-auto mb-2" />
                <div className="text-lg font-semibold text-lime-400">{getAllTags().length}</div>
                <div className="text-sm text-gray-300">Tags</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Media List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <Card className="glass-card border-lime-500/30">
            <CardContent className="p-4 space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="search">Search</Label>
                  <Input
                    id="search"
                    placeholder="Search media files..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Date Range</Label>
                  <Input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>To</Label>
                  <Input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div>
                <Label>Filter by Tags</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {getAllTags().map(tag => (
                    <Button
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTags(prev => 
                        prev.includes(tag) 
                          ? prev.filter(t => t !== tag)
                          : [...prev, tag]
                      )}
                      className="text-xs"
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Media Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMedia
              .slice((page - 1) * pageSize, page * pageSize)
              .map((mediaItem) => (
              <Card 
                key={mediaItem.id} 
                className={`glass-card border-lime-500/30 cursor-pointer transition-all hover:border-lime-500/50 ${
                  selectedMedia?.id === mediaItem.id ? 'ring-2 ring-lime-500' : ''
                }`}
                onClick={() => handleMediaSelect(mediaItem)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {mediaItem.media_type === 'video' ? (
                        <Video className="w-5 h-5 text-blue-400" />
                      ) : (
                        <Camera className="w-5 h-5 text-green-400" />
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {mediaItem.access_level}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadMedia(mediaItem);
                      }}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="font-medium truncate">{mediaItem.filename}</div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Clock className="w-3 h-3" />
                      {new Date(mediaItem.recorded_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <MapPin className="w-3 h-3" />
                      {mediaItem.altitude}m altitude
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <HardDrive className="w-3 h-3" />
                      {formatFileSize(mediaItem.file_size)}
                    </div>
                    {mediaItem.media_type === 'video' && mediaItem.duration && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <Video className="w-3 h-3" />
                        {formatDuration(mediaItem.duration)}
                      </div>
                    )}
                  </div>

                  {mediaItem.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {mediaItem.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {mediaItem.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{mediaItem.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination Controls */}
          {filteredMedia.length > 0 && (
            <div className="flex items-center justify-between mt-3">
              <div className="text-sm text-gray-400">
                Page {page} / {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
                <select
                  className="text-sm bg-transparent border border-lime-500/30 rounded px-2 py-1"
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          )}

          {filteredMedia.length === 0 && !loading && (
            <Card className="glass-card border-lime-500/30">
              <CardContent className="text-center py-8">
                <Video className="w-16 h-16 text-lime-400/50 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-300 mb-2">No Media Found</h3>
                <p className="text-gray-400">
                  {searchTerm || selectedTags.length > 0 || dateRange.start || dateRange.end
                    ? "Try adjusting your filters"
                    : "No drone media has been uploaded yet"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Media Viewer */}
        <div className="space-y-4">
          {selectedMedia ? (
            <Card className="glass-card border-lime-500/30">
              <CardHeader>
                <CardTitle className="gradient-text text-lg">
                  {selectedMedia.media_type === 'video' ? 'Video Player' : 'Photo Viewer'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedMedia.media_type === 'video' ? (
                  <div className="space-y-4">
                    <video
                      ref={setVideoPlayer}
                      className="w-full rounded-lg bg-black"
                      onTimeUpdate={handleVideoTimeUpdate}
                      onLoadedMetadata={handleVideoLoadedMetadata}
                      onError={handleVideoError}
                      controls={false}
                    >
                      <source src={selectedMedia.public_url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>

                    {/* Custom Video Controls */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Button onClick={handleVideoPlay} size="sm">
                          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                        <Button onClick={handleVideoMute} size="sm" variant="outline">
                          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </Button>
                        <Button size="sm" variant="outline">
                          <Maximize className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>{formatDuration(currentTime)}</span>
                          <span>{formatDuration(duration)}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={duration}
                          value={currentTime}
                          onChange={handleVideoSeek}
                          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <img
                      src={selectedMedia.public_url}
                      alt={selectedMedia.filename}
                      className="w-full rounded-lg"
                    />
                  </div>
                )}

                {/* Media Details */}
                <div className="space-y-3 text-sm">
                  <div>
                    <Label className="text-gray-400">Filename</Label>
                    <div className="font-mono text-xs bg-gray-800 p-2 rounded mt-1">
                      {selectedMedia.filename}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-400">Recorded</Label>
                      <div>{new Date(selectedMedia.recorded_at).toLocaleString()}</div>
                    </div>
                    <div>
                      <Label className="text-gray-400">File Size</Label>
                      <div>{formatFileSize(selectedMedia.file_size)}</div>
                    </div>
                    <div>
                      <Label className="text-gray-400">Altitude</Label>
                      <div>{selectedMedia.altitude}m</div>
                    </div>
                    <div>
                      <Label className="text-gray-400">Access Level</Label>
                      <Badge variant="secondary">{selectedMedia.access_level}</Badge>
                    </div>
                  </div>

                  {selectedMedia.tags.length > 0 && (
                    <div>
                      <Label className="text-gray-400">Tags</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedMedia.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      onClick={() => downloadMedia(selectedMedia)} 
                      className="flex-1"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button variant="outline">
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="glass-card border-lime-500/30">
              <CardContent className="text-center py-8">
                <Video className="w-16 h-16 text-lime-400/50 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-300 mb-2">No Media Selected</h3>
                <p className="text-gray-400">
                  Select a video or photo from the library to view it here
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default DroneMediaLibrary;
