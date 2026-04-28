from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_read_root():
    """Test the root endpoint /"""
    response = client.get("/")
    # FastApi default root behavior varies, but typically it returns a 200 or 404
    # Our app might not have a root endpoint, so let's just ensure it responds without internal server error.
    assert response.status_code in [200, 404]

def test_tasks_endpoint_missing_auth():
    """Test that secured endpoints reject requests without auth headers."""
    response = client.get("/tasks/fake-id")
    # Should be 401 Unauthorized because we didn't provide a Bearer token
    assert response.status_code == 401
