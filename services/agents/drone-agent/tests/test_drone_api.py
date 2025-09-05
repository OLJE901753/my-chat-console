from fastapi.testclient import TestClient
from drone_agent.app import app

client = TestClient(app)

def test_schedule_flight():
    r = client.post("/v1/drone/schedule-flight", json={"plan": {"path": []}})
    assert r.status_code == 200
    assert r.json().get("status") == "scheduled"
    assert isinstance(r.json().get("flight_id"), str)

def test_execute_command_ok():
    r = client.post("/v1/drone/execute", json={"command": "manual"})
    assert r.status_code == 200

def test_execute_command_bad():
    r = client.post("/v1/drone/execute", json={"command": "explode"})
    assert r.status_code == 400
