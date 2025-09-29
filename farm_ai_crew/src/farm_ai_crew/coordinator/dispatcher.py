from __future__ import annotations

import asyncio
from typing import Any, Dict

from .models import CoordinatorTask
from ..crew import FarmAiCrew


class TaskDispatcher:
    def __init__(self) -> None:
        self.crew = FarmAiCrew()

    async def dispatch(self, task: CoordinatorTask) -> Dict[str, Any]:
        # Simple routing based on task_type; can be extended to capability-based mapping
        if task.task_type in {"strategic_planning", "farm_coordination"}:
            inputs = {
                "planning_horizon": "12 months",
                "farm_location": task.payload.get("farm_location", "Apple Orchard Farm"),
                "current_year": str(2025),
                "focus_areas": task.payload.get("focus_areas", ["Yield optimization", "Cost reduction"]),
                "task_id": task.task_id,
                "trace_id": task.trace_id or task.task_id,
            }
            crew = self.crew.create_main_crew()
            result = await asyncio.to_thread(crew.kickoff, inputs=inputs)
            return {"crew_type": "strategic_planning", "output": str(result), "inputs_used": inputs}

        inputs = {
            "current_date": task.payload.get("current_date"),
            "farm_location": task.payload.get("farm_location", "Apple Orchard Farm"),
            "current_season": task.payload.get("current_season", "Fall"),
            "priority_focus": task.task_type.replace("_", " ").title(),
            "specific_task": task.task_type,
            "task_payload": task.payload,
            "task_id": task.task_id,
            "trace_id": task.trace_id or task.task_id,
        }
        crew = self.crew.create_daily_operations_crew()
        result = await asyncio.to_thread(crew.kickoff, inputs=inputs)
        return {"crew_type": "daily_operations", "specific_task": task.task_type, "output": str(result), "inputs_used": inputs}

