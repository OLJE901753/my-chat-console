from fastapi.testclient import TestClient
from vision_agent.app import app

client = TestClient(app)

def test_leaf_scan():
    r = client.post("/v1/vision/leaf-scan", json={"media_ids": ["m1"]})
    assert r.status_code == 200
    data = r.json()
    assert "indicators" in data and "confidence" in data


def test_tree_count():
    r = client.post("/v1/vision/tree-count", json={"media_ids": ["m1", "m2"]})
    assert r.status_code == 200
    data = r.json()
    assert data["count"] == 200
