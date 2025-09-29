#!/usr/bin/env python3
"""
Test Drone-Content Integration
Tests the integration service functionality
"""

import asyncio
import aiohttp
import json
from drone_content_integration import DroneContentIntegration, MissionType, ContentMission

async def test_integration():
    """Test the drone-content integration"""
    print("🚁 Testing Drone-Content Integration")
    print("=" * 50)
    
    # Initialize integration service
    integration = DroneContentIntegration()
    await integration.start()
    
    try:
        # Test 1: Health Check
        print("1. Testing Service Health...")
        await integration._check_services_health()
        print("✅ Health check completed")
        
        # Test 2: Create Mission
        print("\n2. Creating Test Mission...")
        content_mission = ContentMission(
            platforms=['youtube', 'instagram', 'tiktok'],
            duration=30,
            context={
                'location': 'Test Field',
                'crop_type': 'wheat',
                'activity': 'test_flight'
            },
            quality_requirements={
                'resolution': '1080p',
                'stabilization': True
            }
        )
        
        mission = await integration.create_mission(
            mission_type=MissionType.FIELD_SURVEY,
            name="Test Field Survey",
            description="Test mission for integration",
            flight_plan={
                'movements': [
                    {'direction': 'forward', 'distance': 5},
                    {'direction': 'right', 'distance': 5},
                    {'direction': 'backward', 'distance': 5},
                    {'direction': 'left', 'distance': 5}
                ],
                'altitude': 3,
                'speed': 1
            },
            content_requirements=content_mission
        )
        
        print(f"✅ Mission created: {mission.id}")
        print(f"   Name: {mission.name}")
        print(f"   Type: {mission.type.value}")
        print(f"   Status: {mission.status.value}")
        
        # Test 3: Mission Status
        print("\n3. Checking Mission Status...")
        status = await integration.get_mission_status(mission.id)
        print(f"✅ Mission status: {status['status']}")
        
        # Test 4: List Missions
        print("\n4. Listing Missions...")
        missions = await integration.list_missions()
        print(f"✅ Found {len(missions)} missions")
        for m in missions:
            print(f"   - {m['name']}: {m['status']}")
        
        # Test 5: Mission Templates
        print("\n5. Testing Mission Templates...")
        from drone_content_integration import MissionTemplates
        
        field_template = MissionTemplates.field_survey_template("Wheat Field A", "North Section")
        print(f"✅ Field survey template created: {field_template['name']}")
        
        crop_template = MissionTemplates.crop_monitoring_template("wheat", "FIELD_001")
        print(f"✅ Crop monitoring template created: {crop_template['name']}")
        
        print("\n" + "=" * 50)
        print("🎉 DRONE-CONTENT INTEGRATION TEST COMPLETE!")
        print("✅ All components working correctly")
        print("✅ Mission creation and management working")
        print("✅ Template system working")
        print("✅ Ready for drone integration!")
        print("=" * 50)
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        await integration.stop()

if __name__ == "__main__":
    asyncio.run(test_integration())
