import React, { useState, useEffect } from 'react';

interface ContentSuggestion {
  platform: string;
  caption: string;
  hashtags: string[];
  optimal_posting_time: string;
  engagement_score: number;
  content_type: string;
  dimensions: number[];
}

interface Clip {
  platform: string;
  duration: number;
  file_path: string;
  thumbnail_path: string;
  quality_score: number;
  tags: string[];
}

interface ContentPreviewProps {
  missionId?: string | undefined;
}

const ContentPreview: React.FC<ContentPreviewProps> = ({ missionId }) => {
  const [contentSuggestions, setContentSuggestions] = useState<ContentSuggestion[]>([]);
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('youtube');

  useEffect(() => {
    if (missionId) {
      loadContentData(missionId);
    }
  }, [missionId]);

  const loadContentData = async (missionId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8031/missions/${missionId}`);
      const mission = await response.json();
      
      if (mission.content_results) {
        setContentSuggestions(mission.content_results.content_suggestions || []);
        setClips(mission.content_results.clips || []);
      }
    } catch (error) {
      console.error('Failed to load content data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'youtube': return '📺';
      case 'instagram': return '📸';
      case 'tiktok': return '🎵';
      default: return '📱';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'youtube': return 'bg-red-100 text-red-800';
      case 'instagram': return 'bg-pink-100 text-pink-800';
      case 'tiktok': return 'bg-black text-white';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDimensions = (dimensions: number[]) => {
    if (dimensions.length >= 2) {
      return `${dimensions[0]}x${dimensions[1]}`;
    }
    return 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading content...</span>
      </div>
    );
  }

  if (contentSuggestions.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        <div className="text-4xl mb-4">🎬</div>
        <p>No content generated yet</p>
        <p className="text-sm">Execute a mission to see generated content</p>
      </div>
    );
  }

  const platforms = [...new Set(contentSuggestions.map(c => c.platform))];
  const selectedContent = contentSuggestions.find(c => c.platform === selectedPlatform);
  const selectedClips = clips.filter(c => c.platform === selectedPlatform);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🎬 Content Preview</h1>
        <p className="text-gray-600">Preview generated content for different platforms</p>
      </div>

      {/* Platform Selector */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Select Platform</h2>
        <div className="flex gap-4">
          {platforms.map((platform) => (
            <button
              key={platform}
              onClick={() => setSelectedPlatform(platform)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedPlatform === platform
                  ? getPlatformColor(platform)
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {getPlatformIcon(platform)} {platform.charAt(0).toUpperCase() + platform.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {selectedContent && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Content Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              {getPlatformIcon(selectedContent.platform)} {selectedContent.platform.charAt(0).toUpperCase() + selectedContent.platform.slice(1)} Content
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Caption</label>
                <div className="p-3 bg-gray-50 rounded-md border">
                  <p className="text-gray-900">{selectedContent.caption}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hashtags</label>
                <div className="flex flex-wrap gap-1">
                  {selectedContent.hashtags.map((hashtag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                    >
                      {hashtag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dimensions</label>
                  <p className="text-gray-900">{formatDimensions(selectedContent.dimensions)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Engagement Score</label>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${selectedContent.engagement_score * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">
                      {(selectedContent.engagement_score * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Optimal Posting Time</label>
                <p className="text-gray-900">{selectedContent.optimal_posting_time}</p>
              </div>
            </div>
          </div>

          {/* Video Clips */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">Video Clips</h3>
            
            {selectedClips.length > 0 ? (
              <div className="space-y-4">
                {selectedClips.map((clip, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">Clip {index + 1}</h4>
                        <p className="text-sm text-gray-600">
                          {clip.duration}s • {formatDimensions([clip.platform === 'youtube' ? 1920 : 1080, clip.platform === 'tiktok' ? 1920 : 1080])}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-12 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${clip.quality_score * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600">
                          {(clip.quality_score * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-2">
                      {clip.tags.map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      File: {clip.file_path.split('/').pop()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">📹</div>
                <p>No clips available for this platform</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-6 flex gap-4">
        <button className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Download All Content
        </button>
        <button className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
          Schedule Posts
        </button>
        <button className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
          Share Preview
        </button>
      </div>
    </div>
  );
};

export default ContentPreview;
