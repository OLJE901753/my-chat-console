import os
import time
import uuid

import pytest
from supabase import create_client


@pytest.mark.e2e
def test_coordinator_smoke():
    supabase_url = os.environ.get("COORDINATOR_SUPABASE_URL")
    supabase_key = os.environ.get("COORDINATOR_SUPABASE_SERVICE_ROLE_KEY")
    assert supabase_url and supabase_key, "Supabase env not set for smoke test"

    client = create_client(supabase_url, supabase_key)

    task_id = str(uuid.uuid4())
    user_id = None

    # Enqueue task
    client.table("ai_tasks").insert({
        "task_id": task_id,
        "task_type": "strategic_planning",
        "payload": {"farm_location": "Test Farm"},
        "user_id": user_id,
        "trace_id": task_id,
        "priority": "normal",
    }).execute()

    # Poll for experiment creation
    exp_id = None
    deadline = time.time() + 60
    while time.time() < deadline:
        res = client.table("experiments").select("id, metadata").eq("metadata->>task_id", task_id).execute()
        if res.data:
            exp_id = res.data[0]["id"]
            break
        time.sleep(2)

    assert exp_id, "Experiment not created by coordinator"

    # Poll for completion log
    done = False
    deadline = time.time() + 120
    while time.time() < deadline:
        res = client.table("experiment_logs").select("level, message").eq("experiment_id", exp_id).order("created_at").execute()
        msgs = [r["message"] for r in res.data]
        if any(m in ("task_completed", "task_failed") for m in msgs):
            done = True
            break
        time.sleep(2)

    assert done, "Coordinator did not finish the task within timeout"

