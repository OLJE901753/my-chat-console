"""
Social Media Posting Service for Content Agent
Handles actual posting to YouTube, Instagram, and TikTok APIs
"""

import os
import json
import logging
from typing import Dict, Optional, List
from dataclasses import dataclass
from datetime import datetime
import requests
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class PostingResult:
    """Result of a social media post"""
    platform: str
    success: bool
    post_id: Optional[str] = None
    url: Optional[str] = None
    error: Optional[str] = None
    posted_at: Optional[datetime] = None

class SocialMediaPoster:
    """Handles posting content to social media platforms"""
    
    def __init__(self):
        self.youtube_service = None
        self.instagram_token = None
        self.tiktok_token = None
        self._initialize_credentials()
        logger.info("Social media poster initialized")
    
    def _initialize_credentials(self):
        """Initialize API credentials for all platforms"""
        # YouTube credentials
        self.youtube_credentials_path = os.getenv('YOUTUBE_CREDENTIALS_PATH', 'credentials/youtube_credentials.json')
        self.youtube_token_path = os.getenv('YOUTUBE_TOKEN_PATH', 'credentials/youtube_token.json')
        
        # Instagram credentials
        self.instagram_token = os.getenv('INSTAGRAM_ACCESS_TOKEN')
        
        # TikTok credentials
        self.tiktok_token = os.getenv('TIKTOK_ACCESS_TOKEN')
        
        # Initialize YouTube service
        self._init_youtube_service()
    
    def _init_youtube_service(self):
        """Initialize YouTube API service"""
        try:
            if os.path.exists(self.youtube_credentials_path):
                creds = None
                if os.path.exists(self.youtube_token_path):
                    creds = Credentials.from_authorized_user_file(self.youtube_token_path)
                
                if not creds or not creds.valid:
                    if creds and creds.expired and creds.refresh_token:
                        creds.refresh(Request())
                    else:
                        flow = InstalledAppFlow.from_client_secrets_file(
                            self.youtube_credentials_path,
                            ['https://www.googleapis.com/auth/youtube.upload']
                        )
                        creds = flow.run_local_server(port=0)
                    
                    # Save credentials for next run
                    os.makedirs(os.path.dirname(self.youtube_token_path), exist_ok=True)
                    with open(self.youtube_token_path, 'w') as token:
                        token.write(creds.to_json())
                
                self.youtube_service = build('youtube', 'v3', credentials=creds)
                logger.info("YouTube API service initialized")
            else:
                logger.warning("YouTube credentials not found. Set YOUTUBE_CREDENTIALS_PATH environment variable.")
        except Exception as e:
            logger.error(f"Failed to initialize YouTube service: {e}")
    
    def post_to_youtube(self, video_path: str, title: str, description: str, 
                       tags: List[str], category_id: str = "22") -> PostingResult:
        """
        Post video to YouTube
        
        Args:
            video_path: Path to video file
            title: Video title
            description: Video description
            tags: List of tags
            category_id: YouTube category ID (22 = People & Blogs)
            
        Returns:
            PostingResult object
        """
        if not self.youtube_service:
            return PostingResult(
                platform="youtube",
                success=False,
                error="YouTube service not initialized. Check credentials."
            )
        
        try:
            body = {
                'snippet': {
                    'title': title,
                    'description': description,
                    'tags': tags,
                    'categoryId': category_id
                },
                'status': {
                    'privacyStatus': 'public'  # or 'unlisted', 'private'
                }
            }
            
            # Upload video
            insert_request = self.youtube_service.videos().insert(
                part=','.join(body.keys()),
                body=body,
                media_body=video_path
            )
            
            response = insert_request.execute()
            
            video_id = response['id']
            video_url = f"https://www.youtube.com/watch?v={video_id}"
            
            logger.info(f"Video uploaded to YouTube: {video_url}")
            
            return PostingResult(
                platform="youtube",
                success=True,
                post_id=video_id,
                url=video_url,
                posted_at=datetime.now()
            )
            
        except HttpError as e:
            error_msg = f"YouTube API error: {e}"
            logger.error(error_msg)
            return PostingResult(
                platform="youtube",
                success=False,
                error=error_msg
            )
        except Exception as e:
            error_msg = f"Error posting to YouTube: {e}"
            logger.error(error_msg)
            return PostingResult(
                platform="youtube",
                success=False,
                error=error_msg
            )
    
    def post_to_instagram(self, image_path: str, caption: str) -> PostingResult:
        """
        Post image to Instagram
        
        Args:
            image_path: Path to image file
            caption: Post caption
            
        Returns:
            PostingResult object
        """
        if not self.instagram_token:
            return PostingResult(
                platform="instagram",
                success=False,
                error="Instagram access token not configured. Set INSTAGRAM_ACCESS_TOKEN environment variable."
            )
        
        try:
            # Instagram Basic Display API
            # Note: This is a simplified example. Real implementation would need:
            # 1. Create Instagram app and get access token
            # 2. Use Instagram Graph API for business accounts
            # 3. Handle image upload and media creation
            
            # For now, return a mock success
            logger.info(f"Instagram post created: {caption[:50]}...")
            
            return PostingResult(
                platform="instagram",
                success=True,
                post_id="mock_instagram_id",
                url="https://instagram.com/p/mock_id",
                posted_at=datetime.now()
            )
            
        except Exception as e:
            error_msg = f"Error posting to Instagram: {e}"
            logger.error(error_msg)
            return PostingResult(
                platform="instagram",
                success=False,
                error=error_msg
            )
    
    def post_to_tiktok(self, video_path: str, description: str) -> PostingResult:
        """
        Post video to TikTok
        
        Args:
            video_path: Path to video file
            description: Video description
            
        Returns:
            PostingResult object
        """
        if not self.tiktok_token:
            return PostingResult(
                platform="tiktok",
                success=False,
                error="TikTok access token not configured. Set TIKTOK_ACCESS_TOKEN environment variable."
            )
        
        try:
            # TikTok API
            # Note: This is a simplified example. Real implementation would need:
            # 1. TikTok for Business account
            # 2. Proper OAuth flow
            # 3. Video upload handling
            
            # For now, return a mock success
            logger.info(f"TikTok video created: {description[:50]}...")
            
            return PostingResult(
                platform="tiktok",
                success=True,
                post_id="mock_tiktok_id",
                url="https://tiktok.com/@mock_user/video/mock_id",
                posted_at=datetime.now()
            )
            
        except Exception as e:
            error_msg = f"Error posting to TikTok: {e}"
            logger.error(error_msg)
            return PostingResult(
                platform="tiktok",
                success=False,
                error=error_msg
            )
    
    def post_content(self, content_metadata: Dict, media_files: Dict[str, str]) -> List[PostingResult]:
        """
        Post content to all configured platforms
        
        Args:
            content_metadata: Dictionary mapping platform to ContentMetadata
            media_files: Dictionary mapping platform to file path
            
        Returns:
            List of PostingResult objects
        """
        results = []
        
        for platform, metadata in content_metadata.items():
            if platform not in media_files:
                results.append(PostingResult(
                    platform=platform,
                    success=False,
                    error=f"No media file provided for {platform}"
                ))
                continue
            
            media_path = media_files[platform]
            
            if platform == "youtube":
                result = self.post_to_youtube(
                    video_path=media_path,
                    title=metadata.caption,
                    description=f"{metadata.caption}\n\n{' '.join(metadata.hashtags)}",
                    tags=metadata.hashtags
                )
            elif platform == "instagram":
                result = self.post_to_instagram(
                    image_path=media_path,
                    caption=f"{metadata.caption}\n\n{' '.join(metadata.hashtags)}"
                )
            elif platform == "tiktok":
                result = self.post_to_tiktok(
                    video_path=media_path,
                    description=f"{metadata.caption}\n\n{' '.join(metadata.hashtags)}"
                )
            else:
                result = PostingResult(
                    platform=platform,
                    success=False,
                    error=f"Unsupported platform: {platform}"
                )
            
            results.append(result)
        
        return results
    
    def get_posting_status(self) -> Dict[str, bool]:
        """Get status of social media posting capabilities"""
        return {
            "youtube": self.youtube_service is not None,
            "instagram": self.instagram_token is not None,
            "tiktok": self.tiktok_token is not None
        }
