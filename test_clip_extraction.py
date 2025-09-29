#!/usr/bin/env python3
"""
Test Video Clip Extraction
Tests the fixed video processor to generate clips
"""

import requests
import json
import os

def test_clip_extraction():
    base_url = 'http://localhost:8030'
    video_path = 'C:\\Users\\oj\\AppData\\Local\\Temp\\content_agent_3mh7__os\\upload_1759060374.mp4'
    media_id = 'upload_1759060374'
    
    print('🎬 Testing Video Clip Extraction...')
    print(f'📹 Video: {video_path}')
    print(f'🆔 Media ID: {media_id}')
    
    # Check if video exists
    if not os.path.exists(video_path):
        print(f'❌ Video file not found: {video_path}')
        return False
    
    print(f'✅ Video file exists ({os.path.getsize(video_path):,} bytes)')
    
    # Process the video again with fixed code
    process_data = {
        'video_path': video_path,
        'media_id': media_id,
        'context': {
            'location': 'Nordic Farm - Wheat Fields',
            'crop_type': 'wheat',
            'activity': 'drone crop monitoring'
        },
        'platforms': ['youtube', 'instagram', 'tiktok']
    }
    
    print('🔄 Processing video with fixed clip extraction...')
    
    try:
        response = requests.post(f'{base_url}/v1/content/process-video', json=process_data, timeout=60)
        
        if response.status_code == 200:
            result = response.json()
            print('✅ Video processing: SUCCESS')
            print(f'   Processing time: {result.get("processing_time", 0):.2f}s')
            print(f'   Clips generated: {len(result.get("clips", []))}')
            
            if result.get('clips'):
                print('\n📹 Generated Clips:')
                for i, clip in enumerate(result['clips'], 1):
                    print(f'   {i}. {clip["platform"].upper()}:')
                    print(f'      Duration: {clip["duration"]}s')
                    print(f'      Quality: {clip["quality_score"]:.2f}')
                    print(f'      File: {clip["file_path"]}')
                    print(f'      Thumbnail: {clip["thumbnail_path"]}')
                    print()
            else:
                print('   ⚠️ No clips generated')
                
            # Show content suggestions
            if result.get('content_suggestions'):
                print('📱 Content Suggestions:')
                for platform, suggestions in result['content_suggestions'].items():
                    if suggestions:
                        suggestion = suggestions[0]
                        print(f'   {platform.upper()}: {suggestion["caption"]}')
                        print(f'      Hashtags: {suggestion["hashtags"]}')
                        print(f'      Engagement: {suggestion["engagement_score"]:.2f}')
                        print()
            
            return True
        else:
            print(f'❌ Video processing failed: {response.status_code}')
            print(f'   Response: {response.text}')
            return False
            
    except Exception as e:
        print(f'❌ Error: {e}')
        return False

if __name__ == '__main__':
    test_clip_extraction()
