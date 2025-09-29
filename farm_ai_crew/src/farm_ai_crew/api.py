#!/usr/bin/env python
"""
FastAPI wrapper for Farm AI Crew integration with Node.js Enhanced Agent Service.
Provides REST endpoints for task execution from the Node orchestrator.
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
import uvicorn
import logging
import traceback
from datetime import datetime

from .crew import FarmAiCrew
from .norwegian_delegator import NorwegianFarmDelegator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Farm AI Crew API",
    description="REST API for Farm AI Crew task execution",
    version="1.0.0"
)

# Request/Response models
class TaskExecutionRequest(BaseModel):
    """Request model for task execution"""
    task_id: str = Field(..., description="Unique task identifier")
    agent_id: str = Field(..., description="Agent identifier")
    task_type: str = Field(..., description="Type of task to execute")
    payload: Dict[str, Any] = Field(default_factory=dict, description="Task payload")
    trace_id: str = Field(..., description="Trace ID for tracking")
    timeout_ms: Optional[int] = Field(default=30000, description="Timeout in milliseconds")

class TaskExecutionResponse(BaseModel):
    """Response model for task execution"""
    success: bool
    task_id: str
    agent_id: str
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    execution_time_ms: float
    timestamp: str
    trace_id: str

class AgentCapability(BaseModel):
    """Agent capability model"""
    type: str
    version: str
    max_concurrency: int

class AgentStatusResponse(BaseModel):
    """Agent status response"""
    agent_id: str
    name: str
    type: str
    capabilities: List[AgentCapability]
    status: str
    version: str
    last_heartbeat: str

# Global instances
farm_crew: Optional[FarmAiCrew] = None
norwegian_delegator: Optional[NorwegianFarmDelegator] = None

@app.on_event("startup")
async def startup_event():
    """Initialize AI crew instances on startup"""
    global farm_crew, norwegian_delegator
    
    try:
        logger.info("Initializing Farm AI Crew API...")
        
        # Try to initialize FarmAiCrew with better error handling
        try:
            farm_crew = FarmAiCrew()
            logger.info("FarmAiCrew initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize FarmAiCrew: {e}")
            logger.error(traceback.format_exc())
            farm_crew = None
        
        # Try to initialize NorwegianFarmDelegator
        try:
            norwegian_delegator = NorwegianFarmDelegator()
            logger.info("NorwegianFarmDelegator initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize NorwegianFarmDelegator: {e}")
            logger.error(traceback.format_exc())
            norwegian_delegator = None
        
        if farm_crew or norwegian_delegator:
            logger.info("Farm AI Crew API partially initialized")
        else:
            logger.error("Both FarmAiCrew and NorwegianFarmDelegator failed to initialize")
            
    except Exception as e:
        logger.error(f"Critical error in startup: {e}")
        logger.error(traceback.format_exc())

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "Farm AI Crew API",
        "version": "1.0.0"
    }

@app.get("/agents", response_model=List[AgentStatusResponse])
async def get_available_agents():
    """Get list of available AI agents and their capabilities"""
    if not farm_crew:
        raise HTTPException(status_code=503, detail="Farm AI Crew not initialized")
    
    # Return static agent definitions that match the Enhanced Agent Service
    agents = [
        AgentStatusResponse(
            agent_id="farm-manager",
            name="Farm Manager",
            type="strategic",
            capabilities=[
                AgentCapability(type="strategic_planning", version="1.0", max_concurrency=1),
                AgentCapability(type="crisis_management", version="1.0", max_concurrency=1),
                AgentCapability(type="farm_coordination", version="1.0", max_concurrency=1)
            ],
            status="active",
            version="1.0.0",
            last_heartbeat=datetime.now().isoformat()
        ),
        AgentStatusResponse(
            agent_id="crop-health-specialist",
            name="Crop Health Specialist",
            type="production",
            capabilities=[
                AgentCapability(type="crop_analysis", version="1.0", max_concurrency=2),
                AgentCapability(type="disease_detection", version="1.0", max_concurrency=3),
                AgentCapability(type="pest_identification", version="1.0", max_concurrency=2)
            ],
            status="active",
            version="1.0.0",
            last_heartbeat=datetime.now().isoformat()
        ),
        AgentStatusResponse(
            agent_id="irrigation-engineer",
            name="Irrigation Engineer",
            type="resources",
            capabilities=[
                AgentCapability(type="irrigation_optimization", version="1.0", max_concurrency=1),
                AgentCapability(type="soil_analysis", version="1.0", max_concurrency=3),
                AgentCapability(type="water_management", version="1.0", max_concurrency=2)
            ],
            status="active",
            version="1.0.0",
            last_heartbeat=datetime.now().isoformat()
        ),
        AgentStatusResponse(
            agent_id="drone-operations",
            name="Drone Operations",
            type="operations",
            capabilities=[
                AgentCapability(type="flight_planning", version="1.0", max_concurrency=1),
                AgentCapability(type="mission_execution", version="1.0", max_concurrency=2),
                AgentCapability(type="emergency_procedures", version="1.0", max_concurrency=5)
            ],
            status="active",
            version="1.0.0",
            last_heartbeat=datetime.now().isoformat()
        ),
        AgentStatusResponse(
            agent_id="computer-vision",
            name="Computer Vision Agent",
            type="vision",
            capabilities=[
                AgentCapability(type="fruit_counting", version="1.0", max_concurrency=2),
                AgentCapability(type="quality_assessment", version="1.0", max_concurrency=3),
                AgentCapability(type="maturity_detection", version="1.0", max_concurrency=2)
            ],
            status="active",
            version="1.0.0",
            last_heartbeat=datetime.now().isoformat()
        )
    ]
    
    return agents

@app.post("/execute", response_model=TaskExecutionResponse)
async def execute_task(request: TaskExecutionRequest):
    """Execute a task using the appropriate AI agent"""
    start_time = datetime.now()
    
    if not farm_crew:
        raise HTTPException(status_code=503, detail="Farm AI Crew not initialized")
    
    try:
        logger.info(f"🎯 Executing task {request.task_id} for agent {request.agent_id}")
        
        # Map task types to crew operations
        result = None
        
        if request.task_type in ['strategic_planning', 'farm_coordination']:
            # Use strategic planning crew
            inputs = {
                'planning_horizon': '12 months',
                'farm_location': request.payload.get('farm_location', 'Apple Orchard Farm'),
                'current_year': str(datetime.now().year),
                'focus_areas': request.payload.get('focus_areas', ['Yield optimization', 'Cost reduction']),
                'task_id': request.task_id,
                'trace_id': request.trace_id
            }
            crew = farm_crew.create_main_crew()
            crew_result = crew.kickoff(inputs=inputs)
            result = {
                'crew_type': 'strategic_planning',
                'output': str(crew_result),
                'inputs_used': inputs
            }
            
        elif request.task_type in ['crisis_management']:
            # Use crisis response crew
            inputs = {
                'emergency_type': request.payload.get('emergency_type', 'weather_alert'),
                'current_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'farm_location': request.payload.get('farm_location', 'Apple Orchard Farm'),
                'severity_level': request.payload.get('severity_level', 'high'),
                'task_id': request.task_id,
                'trace_id': request.trace_id
            }
            crew = farm_crew.create_crisis_response_crew()
            crew_result = crew.kickoff(inputs=inputs)
            result = {
                'crew_type': 'crisis_response',
                'output': str(crew_result),
                'inputs_used': inputs
            }
            
        elif request.task_type in ['crop_analysis', 'disease_detection', 'pest_identification', 
                                   'irrigation_optimization', 'soil_analysis', 'water_management',
                                   'flight_planning', 'mission_execution', 'fruit_counting', 
                                   'quality_assessment', 'maturity_detection']:
            # Use daily operations crew for operational tasks
            inputs = {
                'current_date': datetime.now().strftime('%Y-%m-%d'),
                'farm_location': request.payload.get('farm_location', 'Apple Orchard Farm'),
                'current_season': request.payload.get('current_season', 'Fall'),
                'priority_focus': request.task_type.replace('_', ' ').title(),
                'specific_task': request.task_type,
                'task_payload': request.payload,
                'task_id': request.task_id,
                'trace_id': request.trace_id
            }
            crew = farm_crew.create_daily_operations_crew()
            crew_result = crew.kickoff(inputs=inputs)
            result = {
                'crew_type': 'daily_operations',
                'specific_task': request.task_type,
                'output': str(crew_result),
                'inputs_used': inputs
            }
            
        else:
            # Fallback to test execution
            logger.warning(f"Unknown task type {request.task_type}, using test mode")
            inputs = {
                'test_mode': True,
                'task_type': request.task_type,
                'farm_location': request.payload.get('farm_location', 'Test Farm'),
                'task_id': request.task_id,
                'trace_id': request.trace_id
            }
            crew = farm_crew.create_daily_operations_crew()
            crew_result = crew.kickoff(inputs=inputs)
            result = {
                'crew_type': 'test_fallback',
                'task_type': request.task_type,
                'output': str(crew_result),
                'inputs_used': inputs
            }
        
        # Calculate execution time
        end_time = datetime.now()
        execution_time_ms = (end_time - start_time).total_seconds() * 1000
        
        logger.info(f"✅ Task {request.task_id} completed successfully in {execution_time_ms:.0f}ms")
        
        return TaskExecutionResponse(
            success=True,
            task_id=request.task_id,
            agent_id=request.agent_id,
            result=result,
            execution_time_ms=execution_time_ms,
            timestamp=end_time.isoformat(),
            trace_id=request.trace_id
        )
        
    except Exception as e:
        end_time = datetime.now()
        execution_time_ms = (end_time - start_time).total_seconds() * 1000
        
        logger.error(f"❌ Task {request.task_id} failed: {e}")
        logger.error(traceback.format_exc())
        
        return TaskExecutionResponse(
            success=False,
            task_id=request.task_id,
            agent_id=request.agent_id,
            error=str(e),
            execution_time_ms=execution_time_ms,
            timestamp=end_time.isoformat(),
            trace_id=request.trace_id
        )

@app.post("/norwegian/execute")
async def execute_norwegian_task(request: TaskExecutionRequest):
    """Execute Norwegian-specific farm optimization tasks"""
    start_time = datetime.now()
    
    if not norwegian_delegator:
        raise HTTPException(status_code=503, detail="Norwegian Farm Delegator not initialized")
    
    try:
        logger.info(f"🇳🇴 Executing Norwegian task {request.task_id}")
        
        # Create sample farm data for Norwegian optimization
        import pandas as pd
        import numpy as np
        
        farm_data = pd.DataFrame({
            'date': pd.date_range('2024-01-01', periods=30, freq='D'),
            'temperature': np.random.normal(15, 5, 30),
            'precipitation': np.random.exponential(2, 30),
            'soil_moisture': np.random.uniform(0.3, 0.8, 30),
            'apple_yield': np.random.normal(1000, 200, 30),
            'persimmon_yield': np.random.normal(800, 150, 30),
            'organic_certified': [True] * 30,
            'farm_size_hectares': [3.5] * 30,
            'export_ready': [True] * 30
        })
        
        # Run Norwegian farm optimization
        result = norwegian_delegator.run_farm_optimization(farm_data)
        
        end_time = datetime.now()
        execution_time_ms = (end_time - start_time).total_seconds() * 1000
        
        logger.info(f"✅ Norwegian task {request.task_id} completed successfully")
        
        return TaskExecutionResponse(
            success=True,
            task_id=request.task_id,
            agent_id=request.agent_id,
            result={
                'norwegian_optimization': result,
                'farm_data_rows': len(farm_data)
            },
            execution_time_ms=execution_time_ms,
            timestamp=end_time.isoformat(),
            trace_id=request.trace_id
        )
        
    except Exception as e:
        end_time = datetime.now()
        execution_time_ms = (end_time - start_time).total_seconds() * 1000
        
        logger.error(f"❌ Norwegian task {request.task_id} failed: {e}")
        logger.error(traceback.format_exc())
        
        return TaskExecutionResponse(
            success=False,
            task_id=request.task_id,
            agent_id=request.agent_id,
            error=str(e),
            execution_time_ms=execution_time_ms,
            timestamp=end_time.isoformat(),
            trace_id=request.trace_id
        )

def run_server(host: str = "0.0.0.0", port: int = 8000):
    """Run the FastAPI server"""
    logger.info(f"🚀 Starting Farm AI Crew API server on {host}:{port}")
    uvicorn.run("farm_ai_crew.api:app", host=host, port=port, reload=False)

if __name__ == "__main__":
    run_server()
