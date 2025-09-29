"""
Simplified Video Processing Service for Content Agent
Mock implementation for testing without heavy dependencies
"""

import os
import tempfile
import logging
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class VideoClip:
    """Represents a video clip with metadata"""
    start_time: float
    end_time: float
    duration: float
    file_path: str
    thumbnail_path: str
    description: str
    tags: List[str]
    quality_score: float
    platform: str  # 'youtube', 'instagram', 'tiktok'

@dataclass
class VideoProcessingConfig:
    """Configuration for video processing"""
    # Platform-specific dimensions
    youtube_dimensions: Tuple[int, int] = (1920, 1080)  # 16:9
    instagram_dimensions: Tuple[int, int] = (1080, 1080)  # 1:1 square
    tiktok_dimensions: Tuple[int, int] = (1080, 1920)  # 9:16 vertical
    
    # Quality settings
    target_fps: int = 30
    target_bitrate: str = "2M"
    
    # Clip settings
    min_clip_duration: float = 3.0  # seconds
    max_clip_duration: float = 60.0  # seconds
    preferred_clip_duration: float = 15.0  # seconds

class VideoProcessor:
    """Simplified video processing class for testing"""
    
    def __init__(self, config: VideoProcessingConfig = None):
        self.config = config or VideoProcessingConfig()
        self.temp_dir = tempfile.mkdtemp(prefix="content_agent_")
        logger.info(f"Simplified video processor initialized with temp directory: {self.temp_dir}")
    
    def process_video(self, video_path: str, media_id: str) -> List[VideoClip]:
        """
        Process a video file and extract optimized clips for different platforms
        Mock implementation for testing
        """
        try:
            logger.info(f"Processing video (mock): {video_path}")
            
            # Mock video duration
            total_duration = 120.0  # 2 minutes
            
            logger.info(f"Video loaded (mock): {total_duration:.2f}s duration")
            
            # Generate mock clips for each platform
            clips = []
            
            # YouTube clips (16:9)
            youtube_clips = self._generate_mock_clips(media_id, "youtube", 2)
            clips.extend(youtube_clips)
            
            # Instagram clips (1:1)
            instagram_clips = self._generate_mock_clips(media_id, "instagram", 2)
            clips.extend(instagram_clips)
            
            # TikTok clips (9:16)
            tiktok_clips = self._generate_mock_clips(media_id, "tiktok", 2)
            clips.extend(tiktok_clips)
            
            logger.info(f"Generated {len(clips)} mock clips from video")
            return clips
            
        except Exception as e:
            logger.error(f"Error processing video {video_path}: {str(e)}")
            raise
    
    def _generate_mock_clips(self, media_id: str, platform: str, count: int) -> List[VideoClip]:
        """Generate mock video clips for testing"""
        clips = []
        
        for i in range(count):
            start_time = i * 15.0
            end_time = start_time + 15.0
            duration = 15.0
            
            # Mock file paths
            clip_filename = f"{media_id}_{platform}_clip_{i+1}.mp4"
            clip_path = os.path.join(self.temp_dir, clip_filename)
            
            thumbnail_filename = f"{media_id}_{platform}_thumb_{i+1}.jpg"
            thumbnail_path = os.path.join(self.temp_dir, thumbnail_filename)
            
            # Create mock files
            self._create_mock_file(clip_path)
            self._create_mock_file(thumbnail_path)
            
            # Generate mock quality score
            quality_score = 0.6 + (i * 0.1)  # Varying quality scores
            
            # Generate mock tags
            tags = self._generate_mock_tags(platform, quality_score)
            
            clip = VideoClip(
                start_time=start_time,
                end_time=end_time,
                duration=duration,
                file_path=clip_path,
                thumbnail_path=thumbnail_path,
                description=f"Mock {platform} clip from drone footage",
                tags=tags,
                quality_score=quality_score,
                platform=platform
            )
            
            clips.append(clip)
        
        return clips
    
    def _create_mock_file(self, file_path: str):
        """Create a mock file for testing"""
        try:
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            with open(file_path, 'w') as f:
                f.write(f"Mock file: {file_path}")
        except Exception as e:
            logger.warning(f"Could not create mock file {file_path}: {e}")
    
    def _generate_mock_tags(self, platform: str, quality_score: float) -> List[str]:
        """Generate mock tags based on platform and quality"""
        base_tags = ["drone", "farming", "agriculture", platform]
        
        if quality_score > 0.7:
            base_tags.extend(["high_quality", "professional"])
        elif quality_score > 0.5:
            base_tags.extend(["good_quality", "solid"])
        
        return base_tags
    
    def cleanup(self):
        """Clean up temporary files"""
        try:
            import shutil
            shutil.rmtree(self.temp_dir)
            logger.info(f"Cleaned up temp directory: {self.temp_dir}")
        except Exception as e:
            logger.error(f"Error cleaning up temp directory: {str(e)}")
    
    def __del__(self):
        """Destructor to ensure cleanup"""
        self.cleanup()

# Example usage and testing
if __name__ == "__main__":
    # Test the simplified video processor
    processor = VideoProcessor()
    
    # Example: Process a video file
    video_path = "test_video.mp4"
    clips = processor.process_video(video_path, "test_media_001")
    
    for clip in clips:
        print(f"Platform: {clip.platform}")
        print(f"Duration: {clip.duration:.2f}s")
        print(f"Quality Score: {clip.quality_score:.2f}")
        print(f"File: {clip.file_path}")
        print(f"Thumbnail: {clip.thumbnail_path}")
        print(f"Tags: {', '.join(clip.tags)}")
        print("---")
    
    print("Simplified video processor module loaded successfully!")
