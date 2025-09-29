#!/usr/bin/env python3
"""
Drone-Content Agent Integration Service
Connects Ryzr Tello drone system with content agent for automated video production
"""

import asyncio
import aiohttp
import json
import logging
import time
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum
import os
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MissionType(Enum):
    FIELD_SURVEY = "field_survey"
    CROP_MONITORING = "crop_monitoring"
    WEATHER_CHECK = "weather_check"
    CONTENT_CREATION = "content_creation"
    EMERGENCY_INSPECTION = "emergency_inspection"

class MissionStatus(Enum):
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

@dataclass
class Mission:
    id: str
    type: MissionType
    name: str
    description: str
    flight_plan: Dict[str, Any]
    content_requirements: Dict[str, Any]
    status: MissionStatus
    created_at: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    drone_status: Optional[Dict[str, Any]] = None
    content_results: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None

@dataclass
class ContentMission:
    platforms: List[str]
    duration: int  # seconds
    context: Dict[str, Any]
    quality_requirements: Dict[str, Any]
    auto_upload: bool = False

class DroneContentIntegration:
    """
    Integration service between drone system and content agent
    Handles mission planning, execution, and content generation
    """
    
    def __init__(self, 
                 drone_api_url: str = "http://localhost:3001",
                 content_api_url: str = "http://localhost:8030",
                 websocket_url: str = "ws://localhost:3001"):
        self.drone_api_url = drone_api_url
        self.content_api_url = content_api_url
        self.websocket_url = websocket_url
        
        self.missions: Dict[str, Mission] = {}
        self.active_mission: Optional[Mission] = None
        self.session: Optional[aiohttp.ClientSession] = None
        
        # Content agent endpoints
        self.content_endpoints = {
            'health': f"{content_api_url}/v1/content/health",
            'upload': f"{content_api_url}/v1/content/upload-video",
            'process': f"{content_api_url}/v1/content/process-video",
            'suggest': f"{content_api_url}/v1/content/suggest",
            'hashtags': f"{content_api_url}/v1/content/trending-hashtags"
        }
        
        # Drone API endpoints
        self.drone_endpoints = {
            'status': f"{drone_api_url}/api/drone/status",
            'connect': f"{drone_api_url}/api/drone/connect",
            'takeoff': f"{drone_api_url}/api/drone/takeoff",
            'land': f"{drone_api_url}/api/drone/land",
            'move': f"{drone_api_url}/api/drone/move",
            'record': f"{drone_api_url}/api/drone/start-recording",
            'stop_record': f"{drone_api_url}/api/drone/stop-recording",
            'photo': f"{drone_api_url}/api/drone/capture-photo"
        }
        
        logger.info("Drone-Content Integration Service initialized")
    
    async def start(self):
        """Start the integration service"""
        self.session = aiohttp.ClientSession()
        logger.info("🚁 Drone-Content Integration Service started")
        
        # Check service health
        await self._check_services_health()
    
    async def stop(self):
        """Stop the integration service"""
        if self.session:
            await self.session.close()
        logger.info("🛑 Drone-Content Integration Service stopped")
    
    async def _check_services_health(self):
        """Check if both drone and content services are healthy"""
        try:
            # Check drone service
            async with self.session.get(self.drone_endpoints['status']) as response:
                if response.status == 200:
                    logger.info("✅ Drone service: Healthy")
                else:
                    logger.warning(f"⚠️ Drone service: Status {response.status}")
            
            # Check content service
            async with self.session.get(self.content_endpoints['health']) as response:
                if response.status == 200:
                    data = await response.json()
                    logger.info(f"✅ Content service: Healthy - {data.get('version', 'unknown')}")
                else:
                    logger.warning(f"⚠️ Content service: Status {response.status}")
                    
        except Exception as e:
            logger.error(f"❌ Health check failed: {e}")
    
    async def create_mission(self, 
                           mission_type: MissionType,
                           name: str,
                           description: str,
                           flight_plan: Dict[str, Any],
                           content_requirements: ContentMission) -> Mission:
        """Create a new mission"""
        mission_id = f"mission_{int(time.time())}"
        
        mission = Mission(
            id=mission_id,
            type=mission_type,
            name=name,
            description=description,
            flight_plan=flight_plan,
            content_requirements=content_requirements.__dict__,
            status=MissionStatus.PLANNED,
            created_at=time.strftime("%Y-%m-%d %H:%M:%S")
        )
        
        self.missions[mission_id] = mission
        logger.info(f"📋 Mission created: {mission_id} - {name}")
        
        return mission
    
    async def execute_mission(self, mission_id: str) -> bool:
        """Execute a mission from start to finish"""
        if mission_id not in self.missions:
            logger.error(f"❌ Mission not found: {mission_id}")
            return False
        
        mission = self.missions[mission_id]
        mission.status = MissionStatus.IN_PROGRESS
        mission.started_at = time.strftime("%Y-%m-%d %H:%M:%S")
        self.active_mission = mission
        
        logger.info(f"🚀 Starting mission: {mission.name}")
        
        try:
            # Step 1: Connect to drone
            if not await self._connect_drone():
                raise Exception("Failed to connect to drone")
            
            # Step 2: Execute flight plan
            if not await self._execute_flight_plan(mission):
                raise Exception("Flight plan execution failed")
            
            # Step 3: Capture content
            video_path = await self._capture_content(mission)
            if not video_path:
                raise Exception("Content capture failed")
            
            # Step 4: Process content
            content_results = await self._process_content(mission, video_path)
            if not content_results:
                raise Exception("Content processing failed")
            
            # Step 5: Complete mission
            mission.status = MissionStatus.COMPLETED
            mission.completed_at = time.strftime("%Y-%m-%d %H:%M:%S")
            mission.content_results = content_results
            
            logger.info(f"✅ Mission completed: {mission.name}")
            return True
            
        except Exception as e:
            mission.status = MissionStatus.FAILED
            mission.error_message = str(e)
            logger.error(f"❌ Mission failed: {mission.name} - {e}")
            return False
        
        finally:
            # Ensure drone lands safely
            await self._safe_landing()
            self.active_mission = None
    
    async def _connect_drone(self) -> bool:
        """Connect to the drone"""
        try:
            async with self.session.post(self.drone_endpoints['connect']) as response:
                if response.status == 200:
                    data = await response.json()
                    logger.info("🚁 Drone connected successfully")
                    return data.get('success', False)
                else:
                    logger.error(f"❌ Drone connection failed: {response.status}")
                    return False
        except Exception as e:
            logger.error(f"❌ Drone connection error: {e}")
            return False
    
    async def _execute_flight_plan(self, mission: Mission) -> bool:
        """Execute the flight plan"""
        flight_plan = mission.flight_plan
        
        try:
            # Takeoff
            logger.info("🚁 Taking off...")
            async with self.session.post(self.drone_endpoints['takeoff']) as response:
                if response.status != 200:
                    raise Exception("Takeoff failed")
            
            await asyncio.sleep(2)  # Wait for takeoff
            
            # Execute flight movements
            for movement in flight_plan.get('movements', []):
                direction = movement.get('direction')
                distance = movement.get('distance', 1)
                
                logger.info(f"🚁 Moving {direction} {distance}m")
                async with self.session.post(
                    self.drone_endpoints['move'],
                    json={'direction': direction, 'distance': distance}
                ) as response:
                    if response.status != 200:
                        raise Exception(f"Movement failed: {direction}")
                
                await asyncio.sleep(1)  # Wait between movements
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Flight plan execution failed: {e}")
            return False
    
    async def _capture_content(self, mission: Mission) -> Optional[str]:
        """Capture video content during flight"""
        try:
            # Start recording
            logger.info("📹 Starting video recording...")
            async with self.session.post(self.drone_endpoints['record']) as response:
                if response.status != 200:
                    raise Exception("Failed to start recording")
            
            # Record for specified duration
            duration = mission.content_requirements.get('duration', 30)
            logger.info(f"📹 Recording for {duration} seconds...")
            await asyncio.sleep(duration)
            
            # Stop recording
            async with self.session.post(self.drone_endpoints['stop_record']) as response:
                if response.status != 200:
                    raise Exception("Failed to stop recording")
            
            # In a real implementation, this would return the actual video file path
            # For now, we'll simulate it
            video_path = f"/tmp/drone_video_{mission.id}.mp4"
            logger.info(f"📹 Video captured: {video_path}")
            
            return video_path
            
        except Exception as e:
            logger.error(f"❌ Content capture failed: {e}")
            return None
    
    async def _process_content(self, mission: Mission, video_path: str) -> Optional[Dict[str, Any]]:
        """Process captured content with content agent"""
        try:
            # Upload video to content agent
            logger.info("📤 Uploading video to content agent...")
            
            # Simulate video upload (in real implementation, upload actual file)
            upload_data = {
                'media_id': f"drone_{mission.id}",
                'file_path': video_path
            }
            
            # Process video
            logger.info("🎬 Processing video with content agent...")
            process_data = {
                'video_path': video_path,
                'media_id': upload_data['media_id'],
                'context': mission.content_requirements.get('context', {}),
                'platforms': mission.content_requirements.get('platforms', ['youtube', 'instagram', 'tiktok'])
            }
            
            async with self.session.post(
                self.content_endpoints['process'],
                json=process_data
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    logger.info("✅ Content processing completed")
                    return result
                else:
                    logger.error(f"❌ Content processing failed: {response.status}")
                    return None
                    
        except Exception as e:
            logger.error(f"❌ Content processing error: {e}")
            return None
    
    async def _safe_landing(self):
        """Ensure drone lands safely"""
        try:
            logger.info("🛬 Landing drone safely...")
            async with self.session.post(self.drone_endpoints['land']) as response:
                if response.status == 200:
                    logger.info("✅ Drone landed safely")
                else:
                    logger.warning("⚠️ Landing command failed")
        except Exception as e:
            logger.error(f"❌ Landing error: {e}")
    
    async def get_mission_status(self, mission_id: str) -> Optional[Dict[str, Any]]:
        """Get status of a mission"""
        if mission_id not in self.missions:
            return None
        
        mission = self.missions[mission_id]
        return {
            'id': mission.id,
            'name': mission.name,
            'type': mission.type.value,
            'status': mission.status.value,
            'created_at': mission.created_at,
            'started_at': mission.started_at,
            'completed_at': mission.completed_at,
            'error_message': mission.error_message,
            'content_results': mission.content_results
        }
    
    async def list_missions(self) -> List[Dict[str, Any]]:
        """List all missions"""
        return [await self.get_mission_status(mission_id) for mission_id in self.missions.keys()]
    
    async def cancel_mission(self, mission_id: str) -> bool:
        """Cancel an active mission"""
        if mission_id not in self.missions:
            return False
        
        mission = self.missions[mission_id]
        if mission.status == MissionStatus.IN_PROGRESS:
            mission.status = MissionStatus.CANCELLED
            await self._safe_landing()
            logger.info(f"🚫 Mission cancelled: {mission.name}")
            return True
        
        return False

# Example usage and mission templates
class MissionTemplates:
    """Predefined mission templates for common use cases"""
    
    @staticmethod
    def field_survey_template(field_name: str, area: str) -> Dict[str, Any]:
        """Template for field survey mission"""
        return {
            'type': MissionType.FIELD_SURVEY,
            'name': f"Field Survey - {field_name}",
            'description': f"Comprehensive survey of {field_name} in {area}",
            'flight_plan': {
                'movements': [
                    {'direction': 'forward', 'distance': 10},
                    {'direction': 'right', 'distance': 5},
                    {'direction': 'backward', 'distance': 10},
                    {'direction': 'right', 'distance': 5},
                    {'direction': 'forward', 'distance': 10}
                ],
                'altitude': 5,
                'speed': 1
            },
            'content_requirements': ContentMission(
                platforms=['youtube', 'instagram', 'tiktok'],
                duration=60,
                context={
                    'location': field_name,
                    'area': area,
                    'activity': 'field_survey',
                    'crop_type': 'mixed'
                },
                quality_requirements={
                    'resolution': '1080p',
                    'stabilization': True,
                    'gimbal_mode': 'follow'
                }
            )
        }
    
    @staticmethod
    def crop_monitoring_template(crop_type: str, field_id: str) -> Dict[str, Any]:
        """Template for crop monitoring mission"""
        return {
            'type': MissionType.CROP_MONITORING,
            'name': f"Crop Monitoring - {crop_type}",
            'description': f"Monitor {crop_type} health in field {field_id}",
            'flight_plan': {
                'movements': [
                    {'direction': 'forward', 'distance': 20},
                    {'direction': 'right', 'distance': 10},
                    {'direction': 'backward', 'distance': 20},
                    {'direction': 'right', 'distance': 10},
                    {'direction': 'forward', 'distance': 20}
                ],
                'altitude': 3,
                'speed': 0.5
            },
            'content_requirements': ContentMission(
                platforms=['youtube', 'instagram'],
                duration=45,
                context={
                    'location': f"Field {field_id}",
                    'crop_type': crop_type,
                    'activity': 'crop_monitoring',
                    'season': 'growing'
                },
                quality_requirements={
                    'resolution': '4K',
                    'stabilization': True,
                    'gimbal_mode': 'lock'
                }
            )
        }

if __name__ == "__main__":
    # Example usage
    async def main():
        integration = DroneContentIntegration()
        await integration.start()
        
        # Create a field survey mission
        mission_template = MissionTemplates.field_survey_template("Wheat Field A", "North Section")
        mission = await integration.create_mission(**mission_template)
        
        # Execute the mission
        success = await integration.execute_mission(mission.id)
        
        if success:
            print("✅ Mission completed successfully!")
            status = await integration.get_mission_status(mission.id)
            print(f"Mission results: {status['content_results']}")
        else:
            print("❌ Mission failed!")
        
        await integration.stop()
    
    asyncio.run(main())
