#!/usr/bin/env python3
"""
Create Test Video Clips
Manually create clips from the uploaded video to show the user
"""

import os
import sys
from moviepy import VideoFileClip

def create_test_clips():
    video_path = 'C:\\Users\\oj\\AppData\\Local\\Temp\\content_agent_3mh7__os\\upload_1759060374.mp4'
    output_dir = 'test_clips'
    
    print('🎬 Creating Test Video Clips...')
    print(f'📹 Source: {video_path}')
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    try:
        # Load video
        video = VideoFileClip(video_path)
        print(f'✅ Video loaded: {video.duration:.2f}s, {video.size}')
        
        # Create clips for each platform
        platforms = {
            'youtube': (1920, 1080),
            'instagram': (1080, 1080), 
            'tiktok': (1080, 1920)
        }
        
        clips_created = []
        
        for platform, (width, height) in platforms.items():
            print(f'\n📱 Creating {platform.upper()} clip...')
            
            # Create a 5-second clip from the middle of the video
            start_time = max(0, video.duration / 2 - 2.5)
            end_time = min(video.duration, start_time + 5)
            
            # Extract clip
            clip = video.subclipped(start_time, end_time)
            
            # Resize for platform
            if platform == 'instagram':
                # Square format - crop to center
                clip = clip.resized(height=1080).cropped(x_center=clip.w/2, y_center=clip.h/2, width=1080, height=1080)
            elif platform == 'tiktok':
                # Vertical format - crop to center
                clip = clip.resized(width=1080).cropped(x_center=clip.w/2, y_center=clip.h/2, width=1080, height=1920)
            else:  # youtube
                # Keep original aspect ratio, resize to fit
                clip = clip.resized(height=1080)
            
            # Save clip
            output_path = os.path.join(output_dir, f'{platform}_clip.mp4')
            clip.write_videofile(output_path)
            clip.close()
            
            file_size = os.path.getsize(output_path)
            print(f'   ✅ Created: {output_path}')
            print(f'   📏 Size: {clip.size}, Duration: {clip.duration:.2f}s')
            print(f'   💾 File size: {file_size:,} bytes')
            
            clips_created.append({
                'platform': platform,
                'path': output_path,
                'size': clip.size,
                'duration': clip.duration,
                'file_size': file_size
            })
        
        video.close()
        
        print(f'\n🎉 Successfully created {len(clips_created)} clips!')
        print(f'📁 Output directory: {os.path.abspath(output_dir)}')
        
        print('\n📹 Your Video Clips:')
        for clip in clips_created:
            print(f'   {clip["platform"].upper()}: {clip["path"]}')
            print(f'      Duration: {clip["duration"]:.2f}s, Size: {clip["size"]}, File: {clip["file_size"]:,} bytes')
        
        return True
        
    except Exception as e:
        print(f'❌ Error creating clips: {e}')
        return False

if __name__ == '__main__':
    create_test_clips()
