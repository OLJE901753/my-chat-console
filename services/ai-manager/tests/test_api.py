from fastapi.testclient import TestClient
from ai_manager.app import app

client = TestClient(app)

def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json().get("status") == "ok"

def test_propose_change_requires_approval_for_irreversible():
    body = {
        "title": "Risky change",
        "justification": "test",
        "changes": [
            {"path": "ops.py", "diff": "# trigger harvest()", "summary": ""}
        ],
        "approval": False,
    }
    r = client.post("/v1/manager/propose-change", json=body)
    assert r.status_code == 403
