from fastapi.testclient import TestClient
from content_agent.app import app

client = TestClient(app)

def test_suggest():
    r = client.post('/v1/content/suggest', json={'media_ids': ['m1','m2'], 'context': {}})
    assert r.status_code == 200
    data = r.json()
    assert 'clips' in data and 'captions' in data
    assert isinstance(data['clips'], list)
    assert 'youtube' in data['captions']
