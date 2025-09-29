from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class TaskPriority(str, Enum):
    low = "low"
    normal = "normal"
    high = "high"


class CoordinatorTask(BaseModel):
    task_id: str
    task_type: str
    payload: Dict[str, Any] = Field(default_factory=dict)
    user_id: Optional[str] = None
    trace_id: Optional[str] = None
    priority: TaskPriority = TaskPriority.normal
    deadline: Optional[datetime] = None


class CoordinatorEvent(BaseModel):
    type: str
    task_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    data: Dict[str, Any] = Field(default_factory=dict)

