"""
Video Processing Service for Content Agent
Handles video clip extraction, processing, and optimization for social media platforms
"""

import cv2
import numpy as np
from moviepy import VideoFileClip, CompositeVideoClip, TextClip, ImageClip
from moviepy.video.fx import Resize, Crop
from PIL import Image, ImageDraw, ImageFont
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
    
    # Text overlay settings
    font_size: int = 48
    font_color: str = "white"
    stroke_color: str = "black"
    stroke_width: int = 2

class VideoProcessor:
    """Main video processing class"""
    
    def __init__(self, config: VideoProcessingConfig = None):
        self.config = config or VideoProcessingConfig()
        self.temp_dir = tempfile.mkdtemp(prefix="content_agent_")
        logger.info(f"Video processor initialized with temp directory: {self.temp_dir}")
    
    def process_video(self, video_path: str, media_id: str) -> List[VideoClip]:
        """
        Process a video file and extract optimized clips for different platforms
        
        Args:
            video_path: Path to the input video file
            media_id: Unique identifier for the media
            
        Returns:
            List of VideoClip objects for different platforms
        """
        try:
            logger.info(f"Processing video: {video_path}")
            
            # Load video
            video = VideoFileClip(video_path)
            total_duration = video.duration
            
            logger.info(f"Video loaded: {total_duration:.2f}s duration")
            
            # Analyze video content
            analysis = self._analyze_video(video)
            
            # Extract clips for each platform
            clips = []
            
            # YouTube clips (16:9)
            youtube_clips = self._extract_platform_clips(
                video, analysis, "youtube", media_id
            )
            clips.extend(youtube_clips)
            
            # Instagram clips (1:1)
            instagram_clips = self._extract_platform_clips(
                video, analysis, "instagram", media_id
            )
            clips.extend(instagram_clips)
            
            # TikTok clips (9:16)
            tiktok_clips = self._extract_platform_clips(
                video, analysis, "tiktok", media_id
            )
            clips.extend(tiktok_clips)
            
            video.close()
            
            logger.info(f"Generated {len(clips)} clips from video")
            return clips
            
        except Exception as e:
            logger.error(f"Error processing video {video_path}: {str(e)}")
            raise
    
    def _analyze_video(self, video: VideoFileClip) -> Dict:
        """Analyze video content to identify interesting segments"""
        logger.info("Analyzing video content...")
        
        # Sample frames for analysis
        sample_times = np.linspace(0, video.duration, min(30, int(video.duration)))
        
        # Analyze motion, brightness, and composition
        motion_scores = []
        brightness_scores = []
        composition_scores = []
        
        for t in sample_times:
            frame = video.get_frame(t)
            gray = cv2.cvtColor(frame, cv2.COLOR_RGB2GRAY)
            
            # Motion analysis (simplified)
            motion_score = self._calculate_motion_score(gray)
            motion_scores.append(motion_score)
            
            # Brightness analysis
            brightness = np.mean(gray)
            brightness_scores.append(brightness)
            
            # Composition analysis (rule of thirds, etc.)
            comp_score = self._calculate_composition_score(frame)
            composition_scores.append(comp_score)
        
        # Find interesting segments
        interesting_segments = self._find_interesting_segments(
            sample_times, motion_scores, brightness_scores, composition_scores
        )
        
        return {
            'interesting_segments': interesting_segments,
            'motion_scores': motion_scores,
            'brightness_scores': brightness_scores,
            'composition_scores': composition_scores,
            'total_duration': video.duration
        }
    
    def _calculate_motion_score(self, frame: np.ndarray) -> float:
        """Calculate motion score for a frame (simplified)"""
        # Use Laplacian variance as a simple motion indicator
        return cv2.Laplacian(frame, cv2.CV_64F).var()
    
    def _calculate_composition_score(self, frame: np.ndarray) -> float:
        """Calculate composition score based on rule of thirds, etc."""
        height, width = frame.shape[:2]
        
        # Rule of thirds analysis
        third_w = width // 3
        third_h = height // 3
        
        # Check if important elements are on rule of thirds lines
        score = 0.5  # Base score
        
        # This is a simplified version - in practice, you'd use more sophisticated analysis
        return score
    
    def _find_interesting_segments(self, times, motion_scores, brightness_scores, composition_scores) -> List[Dict]:
        """Find interesting segments based on analysis scores"""
        segments = []
        
        # Combine scores (normalized)
        motion_norm = np.array(motion_scores) / (np.max(motion_scores) + 1e-6)
        brightness_norm = np.array(brightness_scores) / 255.0
        comp_norm = np.array(composition_scores)
        
        # Combined score
        combined_scores = (motion_norm + brightness_norm + comp_norm) / 3
        
        # Find peaks
        threshold = np.mean(combined_scores) + np.std(combined_scores)
        peaks = np.where(combined_scores > threshold)[0]
        
        # Group nearby peaks into segments
        if len(peaks) > 0:
            current_segment = [peaks[0]]
            for i in range(1, len(peaks)):
                if peaks[i] - peaks[i-1] <= 3:  # Within 3 samples
                    current_segment.append(peaks[i])
                else:
                    # End current segment
                    if len(current_segment) >= 2:
                        start_time = times[current_segment[0]]
                        end_time = times[current_segment[-1]]
                        avg_score = np.mean([combined_scores[j] for j in current_segment])
                        
                        segments.append({
                            'start_time': start_time,
                            'end_time': end_time,
                            'score': avg_score,
                            'duration': end_time - start_time
                        })
                    current_segment = [peaks[i]]
            
            # Handle last segment
            if len(current_segment) >= 2:
                start_time = times[current_segment[0]]
                end_time = times[current_segment[-1]]
                avg_score = np.mean([combined_scores[j] for j in current_segment])
                
                segments.append({
                    'start_time': start_time,
                    'end_time': end_time,
                    'score': avg_score,
                    'duration': end_time - start_time
                })
        
        # Sort by score
        segments.sort(key=lambda x: x['score'], reverse=True)
        
        logger.info(f"Found {len(segments)} interesting segments")
        return segments
    
    def _extract_platform_clips(self, video: VideoFileClip, analysis: Dict, platform: str, media_id: str) -> List[VideoClip]:
        """Extract clips optimized for a specific platform"""
        logger.info(f"Extracting {platform} clips...")
        
        clips = []
        segments = analysis['interesting_segments']
        
        # Get platform-specific dimensions
        dimensions = self._get_platform_dimensions(platform)
        
        for i, segment in enumerate(segments[:5]):  # Limit to top 5 segments
            try:
                # Ensure minimum duration
                duration = max(segment['duration'], self.config.min_clip_duration)
                duration = min(duration, self.config.max_clip_duration)
                
                # Adjust timing to fit duration
                start_time = max(0, segment['start_time'])
                end_time = min(video.duration, start_time + duration)
                
                # Extract clip
                clip = video.subclipped(start_time, end_time)
                
                # Resize for platform
                clip = self._resize_for_platform(clip, platform, dimensions)
                
                # Add text overlay if needed
                clip = self._add_text_overlay(clip, platform, f"Clip {i+1}")
                
                # Save clip
                clip_filename = f"{media_id}_{platform}_clip_{i+1}.mp4"
                clip_path = os.path.join(self.temp_dir, clip_filename)
                clip.write_videofile(
                    clip_path,
                    fps=self.config.target_fps,
                    bitrate=self.config.target_bitrate,
                    verbose=False,
                    logger=None
                )
                
                # Generate thumbnail
                thumbnail_path = self._generate_thumbnail(clip, media_id, platform, i+1)
                
                # Create VideoClip object
                video_clip = VideoClip(
                    start_time=start_time,
                    end_time=end_time,
                    duration=duration,
                    file_path=clip_path,
                    thumbnail_path=thumbnail_path,
                    description=f"Optimized {platform} clip from drone footage",
                    tags=self._generate_tags(platform, segment),
                    quality_score=segment['score'],
                    platform=platform
                )
                
                clips.append(video_clip)
                clip.close()
                
            except Exception as e:
                logger.error(f"Error creating {platform} clip {i+1}: {str(e)}")
                continue
        
        logger.info(f"Created {len(clips)} {platform} clips")
        return clips
    
    def _get_platform_dimensions(self, platform: str) -> Tuple[int, int]:
        """Get dimensions for a specific platform"""
        if platform == "youtube":
            return self.config.youtube_dimensions
        elif platform == "instagram":
            return self.config.instagram_dimensions
        elif platform == "tiktok":
            return self.config.tiktok_dimensions
        else:
            return self.config.youtube_dimensions
    
    def _resize_for_platform(self, clip: VideoFileClip, platform: str, dimensions: Tuple[int, int]) -> VideoFileClip:
        """Resize clip for specific platform"""
        target_w, target_h = dimensions
        
        # Calculate scaling
        w, h = clip.size
        scale_w = target_w / w
        scale_h = target_h / h
        
        # Use the smaller scale to ensure we don't crop important content
        scale = min(scale_w, scale_h)
        
        # Resize
        new_w = int(w * scale)
        new_h = int(h * scale)
        
        clip = Resize(clip, (new_w, new_h))
        
        # Center crop if needed
        if new_w != target_w or new_h != target_h:
            x_center = new_w // 2
            y_center = new_h // 2
            x1 = max(0, x_center - target_w // 2)
            y1 = max(0, y_center - target_h // 2)
            x2 = min(new_w, x1 + target_w)
            y2 = min(new_h, y1 + target_h)
            
            clip = Crop(clip, x1=x1, y1=y1, x2=x2, y2=y2)
        
        return clip
    
    def _add_text_overlay(self, clip: VideoFileClip, platform: str, text: str) -> VideoFileClip:
        """Add text overlay to clip"""
        try:
            # Platform-specific text positioning
            if platform == "tiktok":
                position = ('center', 'bottom')
                font_size = self.config.font_size
            else:
                position = ('center', 'top')
                font_size = self.config.font_size // 2
            
            # Create text clip
            txt_clip = TextClip(
                text,
                fontsize=font_size,
                color=self.config.font_color,
                stroke_color=self.config.stroke_color,
                stroke_width=self.config.stroke_width
            ).set_position(position).set_duration(clip.duration)
            
            # Composite with video
            final_clip = CompositeVideoClip([clip, txt_clip])
            return final_clip
            
        except Exception as e:
            logger.warning(f"Could not add text overlay: {str(e)}")
            return clip
    
    def _generate_thumbnail(self, clip: VideoFileClip, media_id: str, platform: str, clip_num: int) -> str:
        """Generate thumbnail for clip"""
        try:
            # Get frame from middle of clip
            thumbnail_time = clip.duration / 2
            frame = clip.get_frame(thumbnail_time)
            
            # Convert to PIL Image
            pil_image = Image.fromarray(frame.astype('uint8'))
            
            # Resize for thumbnail
            pil_image.thumbnail((300, 300), Image.Resampling.LANCZOS)
            
            # Save thumbnail
            thumbnail_filename = f"{media_id}_{platform}_thumb_{clip_num}.jpg"
            thumbnail_path = os.path.join(self.temp_dir, thumbnail_filename)
            pil_image.save(thumbnail_path, "JPEG", quality=85)
            
            return thumbnail_path
            
        except Exception as e:
            logger.error(f"Error generating thumbnail: {str(e)}")
            return ""
    
    def _generate_tags(self, platform: str, segment: Dict) -> List[str]:
        """Generate relevant tags for the clip"""
        base_tags = ["drone", "farm", "agriculture", "aerial"]
        
        if platform == "youtube":
            base_tags.extend(["youtube", "longform", "educational"])
        elif platform == "instagram":
            base_tags.extend(["instagram", "visual", "story"])
        elif platform == "tiktok":
            base_tags.extend(["tiktok", "shortform", "viral"])
        
        # Add quality-based tags
        if segment['score'] > 0.7:
            base_tags.append("high_quality")
        elif segment['score'] > 0.5:
            base_tags.append("good_quality")
        
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
    # Test the video processor
    processor = VideoProcessor()
    
    # Example: Process a video file
    # video_path = "path/to/your/video.mp4"
    # clips = processor.process_video(video_path, "test_media_001")
    
    # for clip in clips:
    #     print(f"Platform: {clip.platform}")
    #     print(f"Duration: {clip.duration:.2f}s")
    #     print(f"Quality Score: {clip.quality_score:.2f}")
    #     print(f"File: {clip.file_path}")
    #     print(f"Thumbnail: {clip.thumbnail_path}")
    #     print(f"Tags: {', '.join(clip.tags)}")
    #     print("---")
    
    print("Video processor module loaded successfully!")
