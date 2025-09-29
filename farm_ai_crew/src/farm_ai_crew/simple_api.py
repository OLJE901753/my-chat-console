#!/usr/bin/env python
"""
Simplified FastAPI server for testing Node.js integration
Works without full CrewAI setup to verify the connection layer
"""

from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
import uvicorn
import logging
from datetime import datetime
import time
import random

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Farm AI Crew API (Simplified)",
    description="Simplified API for testing Node.js integration",
    version="1.0.0"
)

# Request/Response models
class TaskExecutionRequest(BaseModel):
    task_id: str = Field(..., description="Unique task identifier")
    agent_id: str = Field(..., description="Agent identifier")
    task_type: str = Field(..., description="Type of task to execute")
    payload: Dict[str, Any] = Field(default_factory=dict, description="Task payload")
    trace_id: str = Field(..., description="Trace ID for tracking")
    timeout_ms: Optional[int] = Field(default=30000, description="Timeout in milliseconds")

class TaskExecutionResponse(BaseModel):
    success: bool
    task_id: str
    agent_id: str
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    execution_time_ms: float
    timestamp: str
    trace_id: str

class AgentCapability(BaseModel):
    type: str
    version: str
    max_concurrency: int

class AgentStatusResponse(BaseModel):
    agent_id: str
    name: str
    type: str
    capabilities: List[AgentCapability]
    status: str
    version: str
    last_heartbeat: str

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "Farm AI Crew API (Simplified)",
        "version": "1.0.0"
    }

@app.get("/agents", response_model=List[AgentStatusResponse])
async def get_available_agents():
    """Get list of available AI agents (simplified version)"""
    agents = [
        AgentStatusResponse(
            agent_id="farm-manager",
            name="Farm Manager",
            type="strategic",
            capabilities=[
                AgentCapability(type="strategic_planning", version="1.0", max_concurrency=1),
                AgentCapability(type="crisis_management", version="1.0", max_concurrency=1)
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
                AgentCapability(type="disease_detection", version="1.0", max_concurrency=3)
            ],
            status="active",
            version="1.0.0",
            last_heartbeat=datetime.now().isoformat()
        )
    ]
    return agents

@app.post("/execute", response_model=TaskExecutionResponse)
async def execute_task(request: TaskExecutionRequest):
    """Execute a task (simplified simulation for testing)"""
    start_time = datetime.now()
    
    try:
        logger.info(f"Executing task {request.task_id} for agent {request.agent_id}")
        
        # Simulate some processing time
        processing_time = random.uniform(1.0, 3.0)
        time.sleep(processing_time)
        
        # Create a realistic result based on task type
        result = {
            'crew_type': 'simplified_test',
            'task_type': request.task_type,
            'agent_used': request.agent_id,
            'output': f"Successfully completed {request.task_type} for {request.payload.get('farm_location', 'Unknown Farm')}",
            'confidence': random.uniform(0.85, 0.95),
            'recommendations': [
                f"Monitor {request.task_type.replace('_', ' ')} regularly",
                "Consider seasonal adjustments",
                "Review data quality metrics"
            ]
        }
        
        end_time = datetime.now()
        execution_time_ms = (end_time - start_time).total_seconds() * 1000
        
        logger.info(f"Task {request.task_id} completed successfully in {execution_time_ms:.0f}ms")
        
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
        
        logger.error(f"Task {request.task_id} failed: {e}")
        
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
    """Run the simplified FastAPI server"""
    logger.info(f"Starting Farm AI Crew API (Simplified) on {host}:{port}")
    uvicorn.run("farm_ai_crew.simple_api:app", host=host, port=port, reload=False)

if __name__ == "__main__":
    run_server()
