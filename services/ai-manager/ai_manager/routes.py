from __future__ import annotations

from fastapi import APIRouter, HTTPException
from .models import PlanRequest, PlanResponse, Assignment, ProposeChangeRequest, ProposeChangeResponse

router = APIRouter()


@router.get("/health")
def health() -> dict:
    return {"status": "ok"}


@router.post("/v1/manager/plan", response_model=PlanResponse)
def manager_plan(body: PlanRequest) -> PlanResponse:
    # Naive assignment heuristic: map intents by keywords to agents
    assignments: list[Assignment] = []
    for intent in body.intents:
        text = intent.description.lower()
        if any(k in text for k in ["disease", "pest", "leaf", "crop"]):
            role = "crop_health"
        elif any(k in text for k in ["irrigation", "water", "moisture"]):
            role = "irrigation"
        elif any(k in text for k in ["drone", "flight", "mission"]):
            role = "drone_ops"
        elif any(k in text for k in ["analysis", "trend", "analytics", "kpi"]):
            role = "data_analytics"
        elif any(k in text for k in ["content", "post", "social"]):
            role = "content"
        else:
            role = "farm_manager"
        assignments.append(Assignment(agent=role, rationale=f"Matched by keywords for '{intent.description}'"))

    return PlanResponse(assignments=assignments, notes="Heuristic assignment; replace with LLM")


@router.post("/v1/manager/propose-change", response_model=ProposeChangeResponse)
def propose_change(body: ProposeChangeRequest) -> ProposeChangeResponse:
    # Safety: block irreversible actions without explicit approval
    irreversible = any(
        ("spray" in c.diff.lower()) or ("harvest" in c.diff.lower()) for c in body.changes
    )
    if irreversible and not body.approval:
        raise HTTPException(status_code=403, detail="Irreversible action requires approval=true")

    # Only propose; merging must be done by owner outside this service
    accepted = True
    reason = None
    return ProposeChangeResponse(accepted=accepted, reason=reason)
