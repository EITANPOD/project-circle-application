import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.auth import create_access_token, verify_password, get_password_hash

client = TestClient(app)

class TestAuth:
    def test_password_hashing(self):
        """Test password hashing and verification"""
        password = "testpassword123"
        hashed = get_password_hash(password)
        
        assert hashed != password
        assert verify_password(password, hashed)
        assert not verify_password("wrongpassword", hashed)
    
    def test_create_access_token(self):
        """Test JWT token creation"""
        user_id = 1
        token = create_access_token(user_id)
        
        assert isinstance(token, str)
        assert len(token) > 0
    
    def test_login_endpoint(self):
        """Test login endpoint"""
        # This would require a test user in the database
        # For now, just test the endpoint exists
        response = client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "testpassword"
        })
        
        # Should return 401 for non-existent user
        assert response.status_code == 401
    
    def test_signup_endpoint(self):
        """Test signup endpoint"""
        response = client.post("/api/auth/signup", json={
            "email": "newuser@example.com",
            "password": "newpassword123",
            "full_name": "New User"
        })
        
        # Should return 200 for new user or 400 for existing
        assert response.status_code in [200, 400]
