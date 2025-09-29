from __future__ import annotations

import asyncio
from datetime import datetime

from dotenv import load_dotenv

# Load environment variables from .env file FIRST
load_dotenv()

from fastapi import FastAPI

from .dispatcher import TaskDispatcher
from .logger import ExperimentLogger
from .models import CoordinatorEvent, CoordinatorTask
from .settings import get_settings
from .supabase_ingest import SupabaseIngest
from .ws_publisher import BackendPublisher


app = FastAPI(title="Coordinator Service", version="1.0.0")

dispatcher: TaskDispatcher | None = None
logger: ExperimentLogger | None = None
publisher: BackendPublisher | None = None


@app.on_event("startup")
async def on_startup() -> None:
    global dispatcher, logger, publisher
    dispatcher = TaskDispatcher()
    logger = ExperimentLogger()
    publisher = BackendPublisher()

    async def handle_task(task: CoordinatorTask) -> None:
        assert dispatcher and logger
        exp_id = logger.start_experiment(task.task_id, task.user_id, task.task_type)
        try:
            logger.log(exp_id, task.user_id, "info", "task_received", {"task": task.model_dump()})
            if publisher:
                publisher.publish(CoordinatorEvent(type="task_received", task_id=task.task_id, data={"task": task.model_dump()}).model_dump())

            result = await dispatcher.dispatch(task)
            logger.log(exp_id, task.user_id, "info", "task_completed", {"result": result})
            logger.finish(exp_id, "completed")
            if publisher:
                publisher.publish(CoordinatorEvent(type="task_completed", task_id=task.task_id, data={"result": result}).model_dump())
        except Exception as e:
            logger.log(exp_id, task.user_id, "error", "task_failed", {"error": str(e)})
            logger.finish(exp_id, "failed")
            if publisher:
                publisher.publish(CoordinatorEvent(type="task_failed", task_id=task.task_id, data={"error": str(e)}).model_dump())

    ingest = SupabaseIngest()
    asyncio.create_task(ingest.subscribe(handle_task))


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat(), "version": "1.0.0"}

