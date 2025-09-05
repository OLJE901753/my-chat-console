from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel, Field
import uvicorn
from .provider import get_provider
import logging
logger = logging.getLogger("drone-agent")

app = FastAPI(title="Drone Agent (stub)")


class ScheduleFlightRequest(BaseModel):
    plan: dict = Field(..., description="Flight plan JSON")
    scheduled_at: str | None = None


class ExecuteRequest(BaseModel):
    command: str = Field(..., description="manual|auto|pause|resume|land")


@app.post("/v1/drone/schedule-flight")
def schedule_flight(body: ScheduleFlightRequest) -> dict:
    provider = get_provider()
    flight_id = provider.schedule_flight(body.plan, scheduled_at=body.scheduled_at)
    return {"status": "scheduled", "flight_id": flight_id}


@app.post("/v1/drone/execute")
def execute(body: ExecuteRequest) -> dict:
    # NOTE: Low-latency manual control path will use WebRTC/UDP in future
    provider = get_provider()
    logger.info("manual_control_boundary: command=%s", body.command)
    ok = provider.execute(body.command)
    if not ok:
        raise HTTPException(status_code=400, detail="Command failed")
    return {"status": "ok"}


@app.post("/v1/drone/media/ingest")
async def ingest_media(file: UploadFile = File(...)) -> dict:
    # TODO: integrate with Supabase Storage + insert into public.media
    data = await file.read()
    size = len(data)
    name = file.filename or "unknown.bin"
    # For now, just simulate success
    return {"status": "stored", "name": name, "size": size}


def run():
    uvicorn.run("drone_agent.app:app", host="0.0.0.0", port=8010, reload=False)
