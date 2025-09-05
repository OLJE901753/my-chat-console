from fastapi import FastAPI
from pydantic import BaseModel, Field
import uvicorn
from typing import List, Dict, Any
import os

app = FastAPI(title="Vision Agent (stub)")

MAX_TOKENS = int(os.getenv("VISION_MAX_TOKENS", "8000"))


class VisionInput(BaseModel):
    media_ids: List[str] = Field(..., min_items=1)
    max_tokens: int | None = None


class LeafScanOutput(BaseModel):
    indicators: Dict[str, float]
    confidence: float


class TreeCountOutput(BaseModel):
    count: int
    heatmap_ref: str | None = None


@app.post("/v1/vision/leaf-scan", response_model=LeafScanOutput)
def leaf_scan(body: VisionInput) -> LeafScanOutput:
    tokens = body.max_tokens or MAX_TOKENS
    if tokens > MAX_TOKENS:
        tokens = MAX_TOKENS
    # Placeholder logic; integrate OpenAI Vision later
    indicators = {"leaf_health": 0.86, "disease_risk": 0.12}
    return LeafScanOutput(indicators=indicators, confidence=0.82)


@app.post("/v1/vision/tree-count", response_model=TreeCountOutput)
def tree_count(body: VisionInput) -> TreeCountOutput:
    # Placeholder; assume simple heuristic based on number of media ids
    count = 100 * len(body.media_ids)
    return TreeCountOutput(count=count, heatmap_ref=None)


def run():
    uvicorn.run("vision_agent.app:app", host="0.0.0.0", port=8020, reload=False)
