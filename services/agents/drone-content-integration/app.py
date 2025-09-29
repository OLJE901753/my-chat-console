#!/usr/bin/env python3
"""
Drone-Content Integration API
FastAPI service for drone-content agent integration
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import asyncio
import logging
from datetime import datetime

from drone_content_integration import (
    DroneContentIntegration, 
    MissionType, 
    MissionStatus,
    ContentMission,
    MissionTemplates
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Drone-Content Integration API",
    description="API for integrating drone system with content agent",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize integration service
integration_service = DroneContentIntegration()

# Root endpoint
@app.get("/")
async def root():
    return {
        "service": "Drone-Content Integration",
        "version": "1.0.0",
        "status": "healthy",
        "endpoints": {
            "health": "/health",
            "missions": "/missions",
            "templates": "/templates",
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

# Pydantic models
class MissionCreateRequest(BaseModel):
    type: str
    name: str
    description: str
    flight_plan: Dict[str, Any]
    content_requirements: Dict[str, Any]

class MissionResponse(BaseModel):
    id: str
    name: str
    type: str
    status: str
    created_at: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    error_message: Optional[str] = None
    content_results: Optional[Dict[str, Any]] = None

class MissionExecuteRequest(BaseModel):
    mission_id: str

class MissionCancelRequest(BaseModel):
    mission_id: str

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    drone_connected: bool
    content_agent_healthy: bool
    active_missions: int

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Initialize the integration service on startup"""
    await integration_service.start()
    logger.info("🚁 Drone-Content Integration API started")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    await integration_service.stop()
    logger.info("🛑 Drone-Content Integration API stopped")

# API Endpoints

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    try:
        # Check drone connection
        drone_connected = False
        try:
            async with integration_service.session.get(integration_service.drone_endpoints['status']) as response:
                drone_connected = response.status == 200
        except:
            pass
        
        # Check content agent
        content_healthy = False
        try:
            async with integration_service.session.get(integration_service.content_endpoints['health']) as response:
                content_healthy = response.status == 200
        except:
            pass
        
        return HealthResponse(
            status="healthy",
            service="drone-content-integration",
            version="1.0.0",
            drone_connected=drone_connected,
            content_agent_healthy=content_healthy,
            active_missions=len([m for m in integration_service.missions.values() if m.status == MissionStatus.IN_PROGRESS])
        )
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/missions", response_model=MissionResponse)
async def create_mission(request: MissionCreateRequest):
    """Create a new mission"""
    try:
        # Convert string to enum
        mission_type = MissionType(request.type)
        
        # Create content mission object
        content_mission = ContentMission(**request.content_requirements)
        
        # Create mission
        mission = await integration_service.create_mission(
            mission_type=mission_type,
            name=request.name,
            description=request.description,
            flight_plan=request.flight_plan,
            content_requirements=content_mission
        )
        
        return MissionResponse(
            id=mission.id,
            name=mission.name,
            type=mission.type.value,
            status=mission.status.value,
            created_at=mission.created_at,
            started_at=mission.started_at,
            completed_at=mission.completed_at,
            error_message=mission.error_message,
            content_results=mission.content_results
        )
    except Exception as e:
        logger.error(f"Failed to create mission: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/missions/{mission_id}/execute")
async def execute_mission(mission_id: str, background_tasks: BackgroundTasks):
    """Execute a mission (runs in background)"""
    try:
        if mission_id not in integration_service.missions:
            raise HTTPException(status_code=404, detail="Mission not found")
        
        # Execute mission in background
        background_tasks.add_task(integration_service.execute_mission, mission_id)
        
        return {"message": f"Mission {mission_id} execution started", "status": "started"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to execute mission: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/missions/{mission_id}", response_model=MissionResponse)
async def get_mission(mission_id: str):
    """Get mission status"""
    try:
        mission_data = await integration_service.get_mission_status(mission_id)
        if not mission_data:
            raise HTTPException(status_code=404, detail="Mission not found")
        
        return MissionResponse(**mission_data)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get mission: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/missions", response_model=List[MissionResponse])
async def list_missions():
    """List all missions"""
    try:
        missions = await integration_service.list_missions()
        return [MissionResponse(**mission) for mission in missions if mission]
    except Exception as e:
        logger.error(f"Failed to list missions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/missions/{mission_id}/cancel")
async def cancel_mission(mission_id: str):
    """Cancel an active mission"""
    try:
        success = await integration_service.cancel_mission(mission_id)
        if not success:
            raise HTTPException(status_code=400, detail="Mission cannot be cancelled")
        
        return {"message": f"Mission {mission_id} cancelled", "status": "cancelled"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to cancel mission: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/templates")
async def get_mission_templates():
    """Get available mission templates"""
    return {
        "templates": {
            "field_survey": {
                "name": "Field Survey",
                "description": "Comprehensive field survey for content creation",
                "type": "field_survey",
                "duration": "60 seconds",
                "platforms": ["youtube", "instagram", "tiktok"]
            },
            "crop_monitoring": {
                "name": "Crop Monitoring",
                "description": "Monitor crop health and growth",
                "type": "crop_monitoring", 
                "duration": "45 seconds",
                "platforms": ["youtube", "instagram"]
            },
            "weather_check": {
                "name": "Weather Check",
                "description": "Check weather conditions and field status",
                "type": "weather_check",
                "duration": "30 seconds",
                "platforms": ["instagram", "tiktok"]
            }
        }
    }

@app.post("/templates/{template_name}/create")
async def create_mission_from_template(template_name: str, params: Dict[str, Any]):
    """Create a mission from a template"""
    try:
        if template_name == "field_survey":
            field_name = params.get("field_name", "Unknown Field")
            area = params.get("area", "Unknown Area")
            template_data = MissionTemplates.field_survey_template(field_name, area)
        elif template_name == "crop_monitoring":
            crop_type = params.get("crop_type", "Unknown Crop")
            field_id = params.get("field_id", "Unknown Field")
            template_data = MissionTemplates.crop_monitoring_template(crop_type, field_id)
        else:
            raise HTTPException(status_code=400, detail="Unknown template")
        
        # Create mission from template
        mission_type = MissionType(template_data['type'])
        content_mission = template_data['content_requirements']  # Already a ContentMission object
        
        mission = await integration_service.create_mission(
            mission_type=mission_type,
            name=template_data['name'],
            description=template_data['description'],
            flight_plan=template_data['flight_plan'],
            content_requirements=content_mission
        )
        
        return MissionResponse(
            id=mission.id,
            name=mission.name,
            type=mission.type.value,
            status=mission.status.value,
            created_at=mission.created_at,
            started_at=mission.started_at,
            completed_at=mission.completed_at,
            error_message=mission.error_message,
            content_results=mission.content_results
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create mission from template: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/drone/status")
async def get_drone_status():
    """Get current drone status"""
    try:
        async with integration_service.session.get(integration_service.drone_endpoints['status']) as response:
            if response.status == 200:
                return await response.json()
            else:
                raise HTTPException(status_code=response.status, detail="Drone service unavailable")
    except Exception as e:
        logger.error(f"Failed to get drone status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/drone/connect")
async def connect_drone():
    """Connect to drone"""
    try:
        success = await integration_service._connect_drone()
        if success:
            return {"message": "Drone connected successfully", "status": "connected"}
        else:
            raise HTTPException(status_code=400, detail="Failed to connect to drone")
    except Exception as e:
        logger.error(f"Failed to connect drone: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8031)
