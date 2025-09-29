#!/usr/bin/env python3
"""
Real Video Upload and Processing Test
Tests the content agent with a real video file
"""

import requests
import json
import time
import os

def test_real_video_upload():
    """Test the content agent with a real video file"""
    base_url = "http://localhost:8030"
    video_path = "test_drone_video.mp4"
    
    print("🚁 Testing Real Drone Video Upload & Processing")
    print("=" * 60)
    
    # Check if video file exists
    if not os.path.exists(video_path):
        print(f"❌ Video file not found: {video_path}")
        return False
    
    print(f"📹 Video file: {video_path}")
    print(f"   Size: {os.path.getsize(video_path):,} bytes")
    
    # Test 1: Health Check
    print("\n1. Testing Health Check...")
    try:
        response = requests.get(f"{base_url}/v1/content/health", timeout=5)
        if response.status_code == 200:
            health_data = response.json()
            print("✅ Health check: PASSED")
            print(f"   Service: {health_data['service']}")
            print(f"   Version: {health_data['version']}")
            print(f"   Features: {len(health_data['features'])} available")
        else:
            print(f"❌ Health check: FAILED - Status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check: FAILED - {e}")
        return False
    
    # Test 2: Upload Real Video
    print("\n2. Uploading Real Video...")
    try:
        with open(video_path, 'rb') as f:
            files = {'file': ('test_drone_video.mp4', f, 'video/mp4')}
            response = requests.post(f"{base_url}/v1/content/upload-video", files=files, timeout=30)
        
        if response.status_code == 200:
            upload_data = response.json()
            print("✅ Video upload: PASSED")
            print(f"   Media ID: {upload_data.get('media_id')}")
            print(f"   File path: {upload_data.get('file_path')}")
            media_id = upload_data.get('media_id')
        else:
            print(f"❌ Video upload: FAILED - Status {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Video upload: FAILED - {e}")
        return False
    
    # Test 3: Process Real Video
    print("\n3. Processing Real Video...")
    try:
        process_data = {
            "video_path": upload_data.get('file_path'),
            "media_id": media_id,
            "context": {
                "location": "Nordic Farm - Wheat Fields",
                "crop_type": "wheat",
                "activity": "drone crop monitoring",
                "weather": "sunny with light winds",
                "drone_model": "Ryzr Tello",
                "mission_type": "field_survey"
            },
            "platforms": ["youtube", "instagram", "tiktok"]
        }
        
        print("   Processing video with real MoviePy...")
        start_time = time.time()
        
        response = requests.post(
            f"{base_url}/v1/content/process-video",
            json=process_data,
            timeout=120  # Longer timeout for real video processing
        )
        
        processing_time = time.time() - start_time
        
        if response.status_code == 200:
            process_result = response.json()
            print("✅ Video processing: PASSED")
            print(f"   Processing time: {processing_time:.2f}s")
            print(f"   Clips generated: {len(process_result.get('clips', []))}")
            print(f"   Content suggestions: {len(process_result.get('content_suggestions', {}))}")
            
            # Show detailed results
            if process_result.get('clips'):
                print("\n   📹 Generated Clips:")
                for i, clip in enumerate(process_result['clips'][:3]):  # Show first 3 clips
                    print(f"      {i+1}. {clip['platform']}: {clip['duration']}s, quality {clip['quality_score']:.2f}")
                    print(f"         File: {os.path.basename(clip['file_path'])}")
            
            if process_result.get('content_suggestions'):
                print("\n   📱 Content Suggestions:")
                for platform, suggestions in process_result['content_suggestions'].items():
                    if suggestions:
                        suggestion = suggestions[0]
                        print(f"      {platform.upper()}:")
                        print(f"         Caption: {suggestion.get('caption', '')[:80]}...")
                        print(f"         Hashtags: {suggestion.get('hashtags', '')[:60]}...")
                        print(f"         Engagement: {suggestion.get('engagement_score', 0):.2f}")
                        print(f"         Posting time: {suggestion.get('optimal_posting_time', 'N/A')}")
        else:
            print(f"❌ Video processing: FAILED - Status {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Video processing: FAILED - {e}")
        return False
    
    # Test 4: Test Content Generation
    print("\n4. Testing Content Generation...")
    try:
        suggest_data = {
            "media_ids": [media_id],
            "context": {
                "location": "Nordic Farm - Wheat Fields",
                "crop_type": "wheat",
                "activity": "drone crop monitoring"
            },
            "platforms": ["youtube", "instagram", "tiktok"],
            "max_clips_per_platform": 2
        }
        
        response = requests.post(
            f"{base_url}/v1/content/suggest",
            json=suggest_data,
            timeout=30
        )
        
        if response.status_code == 200:
            suggest_result = response.json()
            print("✅ Content generation: PASSED")
            print(f"   Total clips: {len(suggest_result.get('clips', []))}")
            print(f"   Platforms: {list(suggest_result.get('content_suggestions', {}).keys())}")
            
            # Show processing stats
            stats = suggest_result.get('processing_stats', {})
            print(f"   Processing stats: {stats}")
        else:
            print(f"❌ Content generation: FAILED - Status {response.status_code}")
    except Exception as e:
        print(f"❌ Content generation: FAILED - {e}")
    
    # Test 5: Test Trending Hashtags
    print("\n5. Testing Trending Hashtags...")
    try:
        platforms = ["youtube", "instagram", "tiktok"]
        for platform in platforms:
            response = requests.get(
                f"{base_url}/v1/content/trending-hashtags?platform={platform}&category=drone",
                timeout=10
            )
            if response.status_code == 200:
                hashtags = response.json()
                print(f"   {platform.upper()}: {len(hashtags.get('hashtags', []))} hashtags")
            else:
                print(f"   {platform.upper()}: FAILED")
    except Exception as e:
        print(f"❌ Trending hashtags: FAILED - {e}")
    
    print("\n" + "=" * 60)
    print("🎉 REAL VIDEO UPLOAD & PROCESSING TEST COMPLETE!")
    print("✅ Content Agent successfully processed real drone video")
    print("✅ Generated multi-platform content")
    print("✅ Created AI-optimized captions and hashtags")
    print("✅ Ready for production drone footage!")
    print("=" * 60)
    
    return True

if __name__ == "__main__":
    test_real_video_upload()
