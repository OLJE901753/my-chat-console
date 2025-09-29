from __future__ import annotations

from fastapi import FastAPI, UploadFile, File, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import uvicorn
import os
import json
import logging
import time
from pathlib import Path
import tempfile
import shutil

# Import our new modules
from .video_processor import VideoProcessor, VideoClip, VideoProcessingConfig
from .social_media_generator import SocialMediaGenerator, ContentMetadata
from .social_media_poster import SocialMediaPoster, PostingResult

try:
    import psycopg
except Exception:  # pragma: no cover
    psycopg = None  # type: ignore

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Content Agent - Enhanced Video Processing")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=False,  # Set to False when using allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)


# Initialize services
video_processor = VideoProcessor()
social_generator = SocialMediaGenerator()
social_poster = SocialMediaPoster()

# Root endpoint
@app.get("/")
async def root():
    return {
        "service": "Content Agent",
        "version": "2.0.0",
        "status": "healthy",
        "endpoints": {
            "health": "/v1/content/health",
            "suggest": "/v1/content/suggest",
            "process_video": "/v1/content/process-video",
            "upload_video": "/v1/content/upload-video",
            "trending_hashtags": "/v1/content/trending-hashtags",
            "post_content": "/v1/content/post",
            "posting_status": "/v1/content/posting-status",
            "docs": "/docs"
        }
    }

# Favicon endpoint to prevent 404 errors
@app.get("/favicon.ico")
async def favicon(response: Response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return {"message": "No favicon available"}

# Handle preflight OPTIONS requests
@app.options("/{path:path}")
async def options_handler(path: str, response: Response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return {"message": "OK"}

class SuggestInput(BaseModel):
    media_ids: List[str] = Field(..., min_items=1)
    context: Dict[str, Any] | None = None
    platforms: List[str] = Field(default=["youtube", "instagram", "tiktok"])
    max_clips_per_platform: int = Field(default=3)

class ClipPlan(BaseModel):
    media_id: str
    start_sec: float
    end_sec: float
    duration: float
    file_path: str
    thumbnail_path: str
    platform: str
    quality_score: float
    tags: List[str]

class ContentSuggestion(BaseModel):
    platform: str
    caption: str
    hashtags: List[str]
    optimal_posting_time: str
    engagement_score: float
    content_type: str
    dimensions: Optional[tuple] = None

class SuggestOutput(BaseModel):
    clips: List[ClipPlan]
    content_suggestions: Dict[str, List[ContentSuggestion]]  # platform -> suggestions
    processing_stats: Dict[str, Any]

class ProcessVideoInput(BaseModel):
    video_path: str
    media_id: str
    context: Dict[str, Any] | None = None
    platforms: List[str] = Field(default=["youtube", "instagram", "tiktok"])

class ProcessVideoOutput(BaseModel):
    success: bool
    clips: List[ClipPlan]
    content_suggestions: Dict[str, List[ContentSuggestion]]
    processing_time: float
    error: Optional[str] = None


def persist_analytics(payload: Dict[str, Any]) -> None:
    db_url = os.getenv("SUPABASE_DB_URL")
    if not db_url or not psycopg:
        return
    with psycopg.connect(db_url) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                insert into public.analytics (id, flight_id, type, payload)
                values (gen_random_uuid(), null, 'content_suggestion', %s)
                """,
                (json.dumps(payload),),
            )
            conn.commit()


@app.post("/v1/content/suggest", response_model=SuggestOutput)
def suggest(body: SuggestInput) -> SuggestOutput:
    """Generate content suggestions for media IDs (legacy endpoint)"""
    logger.info(f"Generating content suggestions for {len(body.media_ids)} media items")
    
    # For now, return mock data since we don't have actual video files
    # In production, this would fetch videos from storage and process them
    clips = []
    content_suggestions = {}
    
    for platform in body.platforms:
        platform_clips = []
        platform_suggestions = []
        
        for i, media_id in enumerate(body.media_ids[:body.max_clips_per_platform]):
            # Mock clip data
            clip = ClipPlan(
                media_id=media_id,
                start_sec=0.0,
                end_sec=15.0,
                duration=15.0,
                file_path=f"/tmp/{media_id}_{platform}_clip_{i+1}.mp4",
                thumbnail_path=f"/tmp/{media_id}_{platform}_thumb_{i+1}.jpg",
                platform=platform,
                quality_score=0.8,
                tags=["drone", "farming", "agriculture", platform]
            )
            platform_clips.append(clip)
            clips.append(clip)
            
            # Mock content suggestion
            suggestion = ContentSuggestion(
                platform=platform,
                caption=f"Amazing drone footage from our farm! 🚁 #farming #{platform}",
                hashtags=["#drone", "#farming", "#agriculture", f"#{platform}"],
                optimal_posting_time="15:00",
                engagement_score=0.75,
                content_type="video",
                dimensions=(1920, 1080) if platform == "youtube" else (1080, 1080) if platform == "instagram" else (1080, 1920)
            )
            platform_suggestions.append(suggestion)
        
        content_suggestions[platform] = platform_suggestions
    
    processing_stats = {
        "total_media_items": len(body.media_ids),
        "platforms_processed": len(body.platforms),
        "total_clips_generated": len(clips),
        "processing_time": 2.5
    }
    
    output = SuggestOutput(
        clips=clips,
        content_suggestions=content_suggestions,
        processing_stats=processing_stats
    )
    
    # Persist analytics
    try:
        persist_analytics(output.model_dump())
    except Exception as e:
        logger.warning(f"Failed to persist analytics: {e}")
    
    return output

@app.post("/v1/content/process-video", response_model=ProcessVideoOutput)
def process_video(body: ProcessVideoInput) -> ProcessVideoOutput:
    """Process a video file and generate content for multiple platforms"""
    import time
    start_time = time.time()
    
    try:
        logger.info(f"Processing video: {body.video_path}")
        
        # Check if video file exists
        if not os.path.exists(body.video_path):
            raise HTTPException(status_code=404, detail="Video file not found")
        
        # Process video with our enhanced processor
        video_clips = video_processor.process_video(body.video_path, body.media_id)
        
        # Generate content suggestions for each clip
        all_clips = []
        content_suggestions = {}
        
        for platform in body.platforms:
            platform_suggestions = []
            
            # Filter clips for this platform
            platform_clips = [clip for clip in video_clips if clip.platform == platform]
            
            for clip in platform_clips:
                # Convert VideoClip to ClipPlan
                clip_plan = ClipPlan(
                    media_id=clip.media_id if hasattr(clip, 'media_id') else body.media_id,
                    start_sec=clip.start_time,
                    end_sec=clip.end_time,
                    duration=clip.duration,
                    file_path=clip.file_path,
                    thumbnail_path=clip.thumbnail_path,
                    platform=clip.platform,
                    quality_score=clip.quality_score,
                    tags=clip.tags
                )
                all_clips.append(clip_plan)
                
                # Generate content suggestions
                content = social_generator.generate_content(clip, body.context)
                
                if platform in content:
                    suggestion = ContentSuggestion(
                        platform=content[platform].platform,
                        caption=content[platform].caption,
                        hashtags=content[platform].hashtags,
                        optimal_posting_time=content[platform].optimal_posting_time,
                        engagement_score=content[platform].engagement_score,
                        content_type=content[platform].content_type,
                        dimensions=content[platform].dimensions
                    )
                    platform_suggestions.append(suggestion)
            
            content_suggestions[platform] = platform_suggestions
        
        processing_time = time.time() - start_time
        
        logger.info(f"Video processing completed in {processing_time:.2f}s")
        
        return ProcessVideoOutput(
            success=True,
            clips=all_clips,
            content_suggestions=content_suggestions,
            processing_time=processing_time
        )
        
    except Exception as e:
        logger.error(f"Error processing video: {str(e)}")
        return ProcessVideoOutput(
            success=False,
            clips=[],
            content_suggestions={},
            processing_time=time.time() - start_time,
            error=str(e)
        )

@app.post("/v1/content/upload-video")
async def upload_video(file: UploadFile = File(...), media_id: str = None):
    """Upload a video file for processing"""
    if not media_id:
        media_id = f"upload_{int(time.time())}"
    
    try:
        # Create temp file
        temp_dir = tempfile.mkdtemp(prefix="content_agent_")
        video_path = os.path.join(temp_dir, f"{media_id}.{file.filename.split('.')[-1]}")
        
        # Save uploaded file
        with open(video_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        logger.info(f"Video uploaded: {video_path}")
        
        return {
            "success": True,
            "media_id": media_id,
            "file_path": video_path,
            "file_size": len(content),
            "message": "Video uploaded successfully"
        }
        
    except Exception as e:
        logger.error(f"Error uploading video: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/v1/content/trending-hashtags")
def get_trending_hashtags(platform: str = "instagram", category: str = "general"):
    """Get trending hashtags for a platform and category"""
    try:
        hashtags = social_generator.get_trending_hashtags(platform, category)
        return {
            "platform": platform,
            "category": category,
            "hashtags": hashtags,
            "count": len(hashtags)
        }
    except Exception as e:
        logger.error(f"Error getting trending hashtags: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/v1/content/analyze-competitor")
def analyze_competitor(platform: str, keywords: List[str]):
    """Analyze competitor content for insights"""
    try:
        analysis = social_generator.analyze_competitor_content(platform, keywords)
        return analysis
    except Exception as e:
        logger.error(f"Error analyzing competitor: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/v1/content/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "content-agent",
        "version": "2.0.0",
        "features": [
            "video_processing",
            "social_media_generation",
            "multi_platform_optimization",
            "trending_hashtags",
            "competitor_analysis"
        ]
    }

# Social Media Posting Endpoints

class PostContentInput(BaseModel):
    """Input for posting content to social media"""
    content_metadata: Dict[str, Any]  # Platform -> ContentMetadata
    media_files: Dict[str, str]  # Platform -> file path

class PostContentOutput(BaseModel):
    """Output from posting content"""
    success: bool
    results: List[Dict[str, Any]]
    posted_at: str

@app.post("/v1/content/post", response_model=PostContentOutput)
def post_content(body: PostContentInput) -> PostContentOutput:
    """Post content to social media platforms"""
    try:
        logger.info(f"Posting content to {len(body.content_metadata)} platforms")
        
        # Post content to all platforms
        results = social_poster.post_content(body.content_metadata, body.media_files)
        
        # Convert results to dict format
        results_dict = []
        for result in results:
            results_dict.append({
                "platform": result.platform,
                "success": result.success,
                "post_id": result.post_id,
                "url": result.url,
                "error": result.error,
                "posted_at": result.posted_at.isoformat() if result.posted_at else None
            })
        
        success_count = sum(1 for r in results if r.success)
        overall_success = success_count > 0
        
        return PostContentOutput(
            success=overall_success,
            results=results_dict,
            posted_at=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Error posting content: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/v1/content/posting-status")
def get_posting_status():
    """Get status of social media posting capabilities"""
    try:
        status = social_poster.get_posting_status()
        return {
            "success": True,
            "platforms": status,
            "configured_platforms": [p for p, configured in status.items() if configured],
            "total_platforms": len(status)
        }
    except Exception as e:
        logger.error(f"Error getting posting status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def run():
    uvicorn.run("content_agent.app:app", host="0.0.0.0", port=8030, reload=False)
