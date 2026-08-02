"""Smoke test: the app builds and /health responds without auth or DB.

We deliberately do NOT use TestClient as a context manager here, so the
lifespan (which calls init_db and needs a real database) does not run —
/health must work standalone for Docker liveness checks.
"""

from fastapi.testclient import TestClient

from api.main import app


def test_health_endpoint_no_db():
    client = TestClient(app)
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"
