from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field


Role = Literal["farm_manager", "crop_health", "irrigation", "drone_ops", "data_analytics", "content"]
Priority = Literal["low", "medium", "high"]


class TaskIntent(BaseModel):
    description: str = Field(..., min_length=3)
    priority: Priority = Field("medium")
    constraints: Optional[Dict[str, Any]] = None
    desired_outcome: Optional[str] = None


class Assignment(BaseModel):
    agent: Role
    rationale: str


class PlanRequest(BaseModel):
    intents: List[TaskIntent]
    context: Optional[Dict[str, Any]] = None


class PlanResponse(BaseModel):
    assignments: List[Assignment]
    notes: Optional[str] = None


class CodeChange(BaseModel):
    path: str
    diff: str
    summary: Optional[str] = None


class ProposeChangeRequest(BaseModel):
    title: str
    justification: str
    changes: List[CodeChange]
    approval: bool = False


class ProposeChangeResponse(BaseModel):
    accepted: bool
    reason: Optional[str] = None
