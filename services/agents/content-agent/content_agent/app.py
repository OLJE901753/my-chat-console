from __future__ import annotations

from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import List, Dict, Any
import uvicorn
import os
import json

try:
    import psycopg
except Exception:  # pragma: no cover
    psycopg = None  # type: ignore

app = FastAPI(title="Content Agent (stub)")


class SuggestInput(BaseModel):
    media_ids: List[str] = Field(..., min_items=1)
    context: Dict[str, Any] | None = None
    max_tokens: int | None = None


class ClipPlan(BaseModel):
    media_id: str
    start_sec: float
    end_sec: float


class SuggestOutput(BaseModel):
    clips: List[ClipPlan]
    captions: Dict[str, List[str]]  # platform -> captions


def persist_analytics(payload: Dict[str, Any]) -> None:
    db_url = os.getenv("SUPABASE_DB_URL")
    if not db_url or not psycopg:
        return
    with psycopg.connect(db_url) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                insert into public.analytics (id, flight_id, type, payload)
                values (gen_random_uuid(), null, 'content_suggestion', %s)
                """,
                (json.dumps(payload),),
            )
            conn.commit()


@app.post("/v1/content/suggest", response_model=SuggestOutput)
def suggest(body: SuggestInput) -> SuggestOutput:
    # Stub: produce simple clips and captions
    clips = [
        ClipPlan(media_id=mid, start_sec=0.0, end_sec=15.0) for mid in body.media_ids
    ]
    captions = {
        "youtube": ["Harvest prep highlights", "Drone overview of orchard"],
        "instagram": ["Leaf health looks solid", "Sunset pass over trees"],
        "tiktok": ["Quick flyover!", "Before/after irrigation"]
    }
    out = SuggestOutput(clips=clips, captions=captions)
    # Persist suggestion for audit if DB configured
    try:
        persist_analytics(out.model_dump())
    except Exception:
        pass
    return out


def run():
    uvicorn.run("content_agent.app:app", host="0.0.0.0", port=8030, reload=False)
