"""
Social Media Content Generator for Content Agent
Creates platform-specific content including captions, hashtags, and metadata
"""

import json
import logging
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime
import random

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class ContentMetadata:
    """Metadata for social media content"""
    platform: str
    caption: str
    hashtags: List[str]
    optimal_posting_time: str
    engagement_score: float
    content_type: str  # 'video', 'image', 'carousel'
    duration: Optional[float] = None
    dimensions: Optional[Tuple[int, int]] = None

@dataclass
class ContentTemplate:
    """Template for generating content"""
    platform: str
    templates: List[str]
    hashtag_sets: List[List[str]]
    optimal_times: List[str]
    content_types: List[str]

class SocialMediaGenerator:
    """Generates social media content for different platforms"""
    
    def __init__(self):
        self.templates = self._load_templates()
        self.hashtag_database = self._load_hashtag_database()
        logger.info("Social media generator initialized")
    
    def _load_templates(self) -> Dict[str, ContentTemplate]:
        """Load content templates for different platforms"""
        return {
            "youtube": ContentTemplate(
                platform="youtube",
                templates=[
                    "🚁 Drone footage from our farm - {location}",
                    "Amazing aerial view of {crop_type} fields",
                    "Behind the scenes: {activity} with our drone",
                    "Farm technology in action: {technology}",
                    "Sustainable farming practices: {practice}",
                    "Weather update from the field: {weather}",
                    "Crop health monitoring: {crop_health}",
                    "Irrigation system overview: {irrigation}",
                    "Harvest preparation: {harvest_status}",
                    "Farm automation: {automation_feature}"
                ],
                hashtag_sets=[
                    ["#drone", "#farming", "#agriculture", "#technology", "#sustainable"],
                    ["#aerial", "#farmlife", "#precision", "#agtech", "#innovation"],
                    ["#crops", "#harvest", "#irrigation", "#monitoring", "#automation"],
                    ["#youtube", "#farming", "#education", "#tutorial", "#howto"]
                ],
                optimal_times=["09:00", "13:00", "17:00", "20:00"],
                content_types=["video", "shorts", "live"]
            ),
            "instagram": ContentTemplate(
                platform="instagram",
                templates=[
                    "🌱 {emoji} {activity} in progress at {location}",
                    "Drone's eye view of our {crop_type} fields ✈️",
                    "Sustainable farming: {practice} 💚",
                    "Farm tech spotlight: {technology} 🔧",
                    "Behind the scenes: {activity} 📸",
                    "Weather check: {weather} ☀️",
                    "Crop health: {crop_health} 🌿",
                    "Irrigation system: {irrigation} 💧",
                    "Harvest prep: {harvest_status} 🚜",
                    "Automation in action: {automation_feature} ⚙️"
                ],
                hashtag_sets=[
                    ["#drone", "#farming", "#agriculture", "#sustainable", "#farmlife"],
                    ["#aerial", "#precision", "#agtech", "#innovation", "#technology"],
                    ["#crops", "#harvest", "#irrigation", "#monitoring", "#automation"],
                    ["#instagram", "#reels", "#story", "#igtv", "#explore"]
                ],
                optimal_times=["08:00", "12:00", "16:00", "19:00"],
                content_types=["post", "story", "reels", "igtv"]
            ),
            "tiktok": ContentTemplate(
                platform="tiktok",
                templates=[
                    "POV: You're a drone flying over {crop_type} fields 🚁",
                    "This is how we {activity} on our farm ⚡",
                    "Farm tech that will blow your mind 🤯",
                    "Sustainable farming hack: {practice} 💡",
                    "Drone footage that hits different ✨",
                    "Weather update from the field 🌤️",
                    "Crop health check: {crop_health} 🔍",
                    "Irrigation system reveal 💧",
                    "Harvest prep mode: {harvest_status} 🚜",
                    "Automation goals: {automation_feature} 🤖"
                ],
                hashtag_sets=[
                    ["#drone", "#farming", "#agriculture", "#fyp", "#viral"],
                    ["#aerial", "#precision", "#agtech", "#innovation", "#technology"],
                    ["#crops", "#harvest", "#irrigation", "#monitoring", "#automation"],
                    ["#tiktok", "#foryou", "#foryoupage", "#trending", "#explore"]
                ],
                optimal_times=["09:00", "12:00", "15:00", "18:00", "21:00"],
                content_types=["video", "duet", "stitch"]
            )
        }
    
    def _load_hashtag_database(self) -> Dict[str, List[str]]:
        """Load hashtag database for different categories"""
        return {
            "general": [
                "#farming", "#agriculture", "#farmlife", "#sustainable", "#organic",
                "#precision", "#agtech", "#innovation", "#technology", "#automation"
            ],
            "drone": [
                "#drone", "#aerial", "#dronephotography", "#dronestagram", "#dronelife",
                "#fpv", "#quadcopter", "#uav", "#aerialphotography", "#skyview"
            ],
            "crops": [
                "#crops", "#harvest", "#planting", "#growing", "#yield", "#fertility",
                "#soil", "#irrigation", "#watering", "#nutrients", "#growth"
            ],
            "technology": [
                "#agtech", "#precision", "#monitoring", "#sensors", "#data", "#analytics",
                "#iot", "#smartfarming", "#digital", "#automation", "#robotics"
            ],
            "weather": [
                "#weather", "#climate", "#forecast", "#rain", "#sun", "#wind", "#temperature",
                "#humidity", "#pressure", "#season", "#climatechange"
            ],
            "platforms": {
                "youtube": ["#youtube", "#education", "#tutorial", "#howto", "#learning"],
                "instagram": ["#instagram", "#reels", "#story", "#igtv", "#explore"],
                "tiktok": ["#tiktok", "#fyp", "#foryou", "#foryoupage", "#trending"]
            }
        }
    
    def generate_content(self, video_clip, context: Dict = None) -> Dict[str, ContentMetadata]:
        """
        Generate content for all platforms based on video clip
        
        Args:
            video_clip: VideoClip object with metadata
            context: Additional context about the farm/activity
            
        Returns:
            Dictionary mapping platform names to ContentMetadata
        """
        if context is None:
            context = {}
        
        logger.info(f"Generating content for {video_clip.platform} clip")
        
        content = {}
        
        for platform in ["youtube", "instagram", "tiktok"]:
            try:
                metadata = self._generate_platform_content(video_clip, platform, context)
                content[platform] = metadata
            except Exception as e:
                logger.error(f"Error generating {platform} content: {str(e)}")
                continue
        
        return content
    
    def _generate_platform_content(self, video_clip, platform: str, context: Dict) -> ContentMetadata:
        """Generate content for a specific platform"""
        template = self.templates[platform]
        
        # Select random template
        template_text = random.choice(template.templates)
        
        # Fill template with context
        caption = self._fill_template(template_text, context, video_clip)
        
        # Generate hashtags
        hashtags = self._generate_hashtags(platform, video_clip, context)
        
        # Select optimal posting time
        optimal_time = random.choice(template.optimal_times)
        
        # Calculate engagement score
        engagement_score = self._calculate_engagement_score(caption, hashtags, platform)
        
        # Determine content type
        content_type = random.choice(template.content_types)
        
        # Get platform-specific dimensions
        dimensions = self._get_platform_dimensions(platform)
        
        return ContentMetadata(
            platform=platform,
            caption=caption,
            hashtags=hashtags,
            optimal_posting_time=optimal_time,
            engagement_score=engagement_score,
            content_type=content_type,
            duration=video_clip.duration,
            dimensions=dimensions
        )
    
    def _fill_template(self, template: str, context: Dict, video_clip) -> str:
        """Fill template with context data"""
        # Default values
        defaults = {
            "location": "our farm",
            "crop_type": "crops",
            "activity": "monitoring",
            "technology": "drone technology",
            "practice": "sustainable farming",
            "weather": "perfect conditions",
            "crop_health": "excellent",
            "irrigation": "efficient system",
            "harvest_status": "ready",
            "automation_feature": "smart monitoring",
            "emoji": "🌱"
        }
        
        # Merge with context
        data = {**defaults, **context}
        
        # Fill template
        try:
            filled = template.format(**data)
        except KeyError as e:
            logger.warning(f"Missing template variable: {e}")
            filled = template
        
        return filled
    
    def _generate_hashtags(self, platform: str, video_clip, context: Dict) -> List[str]:
        """Generate relevant hashtags for platform"""
        hashtags = []
        
        # Add platform-specific hashtags
        platform_tags = self.hashtag_database["platforms"].get(platform, [])
        hashtags.extend(platform_tags[:3])  # Limit platform tags
        
        # Add general farming hashtags
        general_tags = self.hashtag_database["general"]
        hashtags.extend(random.sample(general_tags, 5))
        
        # Add drone-specific hashtags
        drone_tags = self.hashtag_database["drone"]
        hashtags.extend(random.sample(drone_tags, 3))
        
        # Add technology hashtags
        tech_tags = self.hashtag_database["technology"]
        hashtags.extend(random.sample(tech_tags, 3))
        
        # Add quality-based hashtags
        if video_clip.quality_score > 0.7:
            hashtags.extend(["#highquality", "#professional", "#premium"])
        elif video_clip.quality_score > 0.5:
            hashtags.extend(["#goodquality", "#solid", "#reliable"])
        
        # Add context-based hashtags
        if "crop_type" in context:
            crop = context["crop_type"].lower()
            if "wheat" in crop:
                hashtags.extend(["#wheat", "#grain", "#cereal"])
            elif "corn" in crop:
                hashtags.extend(["#corn", "#maize", "#grain"])
            elif "vegetable" in crop:
                hashtags.extend(["#vegetables", "#fresh", "#healthy"])
        
        # Remove duplicates and limit to 20 hashtags
        hashtags = list(set(hashtags))[:20]
        
        return hashtags
    
    def _calculate_engagement_score(self, caption: str, hashtags: List[str], platform: str) -> float:
        """Calculate predicted engagement score"""
        score = 0.5  # Base score
        
        # Caption length scoring
        caption_length = len(caption)
        if platform == "youtube":
            if 50 <= caption_length <= 200:
                score += 0.2
        elif platform == "instagram":
            if 100 <= caption_length <= 500:
                score += 0.2
        elif platform == "tiktok":
            if 20 <= caption_length <= 100:
                score += 0.2
        
        # Hashtag scoring
        hashtag_count = len(hashtags)
        if platform == "youtube":
            if 5 <= hashtag_count <= 15:
                score += 0.1
        elif platform == "instagram":
            if 10 <= hashtag_count <= 30:
                score += 0.1
        elif platform == "tiktok":
            if 3 <= hashtag_count <= 10:
                score += 0.1
        
        # Emoji usage
        emoji_count = sum(1 for c in caption if ord(c) > 127)
        if 1 <= emoji_count <= 3:
            score += 0.1
        
        # Engagement keywords
        engagement_keywords = ["amazing", "incredible", "wow", "check this out", "you won't believe"]
        if any(keyword in caption.lower() for keyword in engagement_keywords):
            score += 0.1
        
        return min(score, 1.0)  # Cap at 1.0
    
    def _get_platform_dimensions(self, platform: str) -> Tuple[int, int]:
        """Get optimal dimensions for platform"""
        dimensions = {
            "youtube": (1920, 1080),
            "instagram": (1080, 1080),
            "tiktok": (1080, 1920)
        }
        return dimensions.get(platform, (1920, 1080))
    
    def generate_batch_content(self, video_clips: List, context: Dict = None) -> Dict[str, List[ContentMetadata]]:
        """Generate content for multiple video clips"""
        logger.info(f"Generating batch content for {len(video_clips)} clips")
        
        batch_content = {
            "youtube": [],
            "instagram": [],
            "tiktok": []
        }
        
        for clip in video_clips:
            try:
                content = self.generate_content(clip, context)
                
                for platform, metadata in content.items():
                    batch_content[platform].append(metadata)
                    
            except Exception as e:
                logger.error(f"Error generating content for clip: {str(e)}")
                continue
        
        return batch_content
    
    def get_trending_hashtags(self, platform: str, category: str = "general") -> List[str]:
        """Get trending hashtags for platform and category"""
        # In a real implementation, this would fetch from social media APIs
        # For now, return curated lists
        
        trending = {
            "youtube": {
                "general": ["#farming", "#agriculture", "#technology", "#sustainable", "#innovation"],
                "drone": ["#drone", "#aerial", "#dronephotography", "#fpv", "#skyview"]
            },
            "instagram": {
                "general": ["#farmlife", "#sustainable", "#organic", "#precision", "#agtech"],
                "drone": ["#dronestagram", "#aerial", "#dronelife", "#skyview", "#fpv"]
            },
            "tiktok": {
                "general": ["#farming", "#agriculture", "#fyp", "#viral", "#trending"],
                "drone": ["#drone", "#aerial", "#fyp", "#viral", "#skyview"]
            }
        }
        
        return trending.get(platform, {}).get(category, [])
    
    def analyze_competitor_content(self, platform: str, keywords: List[str]) -> Dict:
        """Analyze competitor content for insights (placeholder)"""
        # In a real implementation, this would analyze competitor posts
        return {
            "platform": platform,
            "keywords": keywords,
            "avg_engagement": 0.65,
            "best_posting_times": ["09:00", "15:00", "19:00"],
            "trending_hashtags": self.get_trending_hashtags(platform),
            "content_suggestions": [
                "Use more visual content",
                "Post during peak hours",
                "Include trending hashtags"
            ]
        }

# Example usage and testing
if __name__ == "__main__":
    # Test the social media generator
    generator = SocialMediaGenerator()
    
    # Example context
    context = {
        "location": "Nordic Farm",
        "crop_type": "wheat fields",
        "activity": "crop monitoring",
        "weather": "sunny with light winds"
    }
    
    # Example video clip (mock)
    class MockVideoClip:
        def __init__(self):
            self.platform = "youtube"
            self.duration = 15.0
            self.quality_score = 0.8
    
    mock_clip = MockVideoClip()
    
    # Generate content
    content = generator.generate_content(mock_clip, context)
    
    for platform, metadata in content.items():
        print(f"\n{platform.upper()}:")
        print(f"Caption: {metadata.caption}")
        print(f"Hashtags: {', '.join(metadata.hashtags[:10])}")
        print(f"Optimal time: {metadata.optimal_posting_time}")
        print(f"Engagement score: {metadata.engagement_score:.2f}")
    
    print("\nSocial media generator module loaded successfully!")
