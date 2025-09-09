import pytest
from unittest.mock import Mock, patch
from app.ai_workout_generator import AIWorkoutGenerator, AIWorkoutRequest

class TestAIWorkoutGenerator:
    def test_ai_workout_request_validation(self):
        """Test AIWorkoutRequest model validation"""
        # Valid request
        request = AIWorkoutRequest(
            user_request="I want a 30-minute upper body workout",
            workout_type="strength",
            duration_minutes=30,
            difficulty_level="intermediate"
        )
        
        assert request.user_request == "I want a 30-minute upper body workout"
        assert request.workout_type == "strength"
        assert request.duration_minutes == 30
        assert request.difficulty_level == "intermediate"
    
    def test_ai_workout_request_defaults(self):
        """Test AIWorkoutRequest with default values"""
        request = AIWorkoutRequest(user_request="Test workout")
        
        assert request.workout_type is None
        assert request.duration_minutes == 45
        assert request.difficulty_level == "intermediate"
    
    @patch('app.ai_workout_generator.Groq')
    def test_ai_workout_generator_init(self, mock_groq):
        """Test AIWorkoutGenerator initialization"""
        mock_client = Mock()
        mock_groq.return_value = mock_client
        
        generator = AIWorkoutGenerator()
        
        assert generator.client == mock_client
        mock_groq.assert_called_once()
    
    def test_ai_workout_generator_real_api(self):
        """Test AIWorkoutGenerator with real API (if key is available)"""
        import os
        if not os.getenv('GROQ_API_KEY') or os.getenv('GROQ_API_KEY') == 'test-key':
            pytest.skip("Real GROQ_API_KEY not available")
        
        # Test with real API
        generator = AIWorkoutGenerator()
        request = AIWorkoutRequest(
            user_request="I want a 5-minute quick workout",
            workout_type="general",
            duration_minutes=5,
            difficulty_level="beginner"
        )
        
        # This will make a real API call
        result = generator.generate_workout(request)
        
        assert result is not None
        assert hasattr(result, 'title')
        assert hasattr(result, 'exercises')
    
    @patch('app.ai_workout_generator.Groq')
    def test_ai_workout_generator_init_without_api_key(self, mock_groq):
        """Test AIWorkoutGenerator initialization without API key"""
        with patch.dict('os.environ', {'GROQ_API_KEY': ''}):
            with pytest.raises(ValueError, match="GROQ_API_KEY environment variable is not set"):
                AIWorkoutGenerator()
    
    @patch('app.ai_workout_generator.Groq')
    def test_build_prompt(self, mock_groq):
        """Test prompt building"""
        mock_client = Mock()
        mock_groq.return_value = mock_client
        
        generator = AIWorkoutGenerator()
        request = AIWorkoutRequest(
            user_request="I want a cardio workout",
            workout_type="cardio",
            duration_minutes=20,
            difficulty_level="advanced"
        )
        
        prompt = generator._build_prompt(request)
        
        assert "I want a cardio workout" in prompt
        assert "cardio" in prompt
        assert "20" in prompt
        assert "advanced" in prompt
        assert "JSON" in prompt
