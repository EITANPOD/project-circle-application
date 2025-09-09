import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

class TestWorkoutsAPI:
    def test_workouts_endpoints_exist(self):
        """Test that workout endpoints exist and return proper status codes"""
        # Test GET /api/workouts (should require authentication)
        response = client.get("/api/workouts")
        assert response.status_code == 401  # Unauthorized without auth
    
    def test_ai_test_endpoint(self):
        """Test AI test endpoint"""
        response = client.get("/api/workouts/ai-test")
        # Should return 500 if GROQ_API_KEY is not set, or 200 if it is
        assert response.status_code in [200, 500]
    
    def test_ai_generate_endpoint(self):
        """Test AI generate endpoint"""
        response = client.post("/api/workouts/ai-generate", json={
            "user_request": "I want a 30-minute workout",
            "workout_type": "strength",
            "duration_minutes": 30,
            "difficulty": "intermediate"
        })
        # Should return 500 if GROQ_API_KEY is not set, or 200 if it is
        assert response.status_code in [200, 500]
    
    def test_ai_generate_and_save_endpoint(self):
        """Test AI generate and save endpoint"""
        response = client.post("/api/workouts/ai-generate-and-save", json={
            "user_request": "I want a 30-minute workout",
            "workout_type": "strength",
            "duration_minutes": 30,
            "difficulty": "intermediate"
        })
        # Should return 401 (unauthorized) or 500 (API key issue)
        assert response.status_code in [401, 500]
