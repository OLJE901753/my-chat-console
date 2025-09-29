from __future__ import annotations

from datetime import datetime
from typing import Any, Dict

from supabase import create_client

from .settings import get_settings


class ExperimentLogger:
    def __init__(self) -> None:
        settings = get_settings()
        if not settings.supabase_url or not settings.supabase_service_role_key:
            print("WARNING: Supabase credentials missing for logger - using file-based logging")
            self.client = None
        else:
            self.client = create_client(str(settings.supabase_url), settings.supabase_service_role_key)

    def start_experiment(self, task_id: str, user_id: str | None, task_type: str) -> str:
        if self.client is None:
            print(f"LOG: Starting experiment {task_id} ({task_type})")
            return f"file_log_{task_id}"
        
        data = {
            "user_id": user_id,
            "name": f"task:{task_type}",
            "status": "running",
            "started_at": datetime.utcnow().isoformat(),
            "metadata": {"task_id": task_id, "task_type": task_type},
        }
        res = self.client.table("experiments").insert(data).execute()
        exp_id = res.data[0]["id"]
        return exp_id

    def log(self, experiment_id: str, user_id: str | None, level: str, message: str, payload: Dict[str, Any] | None = None) -> None:
        if self.client is None:
            print(f"LOG: [{level}] {message} - {payload or {}}")
            return
        
        self.client.table("experiment_logs").insert({
            "experiment_id": experiment_id,
            "user_id": user_id,
            "level": level,
            "message": message,
            "payload": payload or {},
        }).execute()

    def finish(self, experiment_id: str, status: str) -> None:
        if self.client is None:
            print(f"LOG: Finished experiment {experiment_id} with status: {status}")
            return
        
        self.client.table("experiments").update({
            "status": status,
            "ended_at": datetime.utcnow().isoformat(),
        }).eq("id", experiment_id).execute()

