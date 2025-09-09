import os
import json
from typing import Dict, List, Optional
from groq import Groq
from pydantic import BaseModel

class AIWorkoutRequest(BaseModel):
    user_request: str
    workout_type: Optional[str] = None
    duration_minutes: Optional[int] = 45
    difficulty_level: Optional[str] = "intermediate"
    equipment_available: Optional[List[str]] = None
    focus_areas: Optional[List[str]] = None

class Exercise(BaseModel):
    name: str
    sets: int
    reps: int
    rest_seconds: int
    notes: str

class AIWorkoutResponse(BaseModel):
    title: str
    description: str
    estimated_duration: int
    difficulty: str
    exercises: List[Exercise]
    tips: List[str]

class AIWorkoutGenerator:
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key or api_key == "your-groq-api-key-here":
            raise ValueError("GROQ_API_KEY environment variable is not set or is using the default placeholder value")
        self.client = Groq(api_key=api_key)
        
    def generate_workout(self, request: AIWorkoutRequest) -> AIWorkoutResponse:
        """Generate a workout using Groq API"""
        
        # Build the prompt for Groq
        prompt = self._build_prompt(request)
        
        try:
            response = self.client.chat.completions.create(
                model="meta-llama/llama-4-scout-17b-16e-instruct",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a professional fitness trainer and workout planner. Create detailed, safe, and effective workout plans based on user requests. Always provide specific exercises with sets, reps, rest periods, and helpful notes."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_tokens=1500
            )
            
            # Parse the AI response
            ai_content = response.choices[0].message.content
            return self._parse_ai_response(ai_content, request)
            
        except Exception as e:
            raise Exception(f"Failed to generate workout: {str(e)}")
    
    def _build_prompt(self, request: AIWorkoutRequest) -> str:
        """Build the prompt for Groq AI based on user request"""
        
        prompt_parts = [
            f"Create a workout plan based on this request: '{request.user_request}'"
        ]
        
        if request.workout_type:
            prompt_parts.append(f"Workout type: {request.workout_type}")
        
        if request.duration_minutes:
            prompt_parts.append(f"Duration: {request.duration_minutes} minutes")
        
        if request.difficulty_level:
            prompt_parts.append(f"Difficulty: {request.difficulty_level}")
        
        if request.equipment_available:
            prompt_parts.append(f"Available equipment: {', '.join(request.equipment_available)}")
        
        if request.focus_areas:
            prompt_parts.append(f"Focus areas: {', '.join(request.focus_areas)}")
        
        prompt_parts.extend([
            "",
            "Please provide the workout in this exact JSON format:",
            """{
  "title": "Workout Title",
  "description": "Brief description of the workout",
  "estimated_duration": 45,
  "difficulty": "beginner/intermediate/advanced",
  "exercises": [
    {
      "name": "Exercise Name",
      "sets": 3,
      "reps": 12,
      "rest_seconds": 60,
      "notes": "Form tips and variations"
    }
  ],
  "tips": [
    "Tip 1",
    "Tip 2"
  ]
}""",
            "",
            "Make sure the workout is safe, effective, and matches the user's request. Include 4-8 exercises with proper progression."
        ])
        
        return "\n".join(prompt_parts)
    
    def _parse_ai_response(self, ai_content: str, request: AIWorkoutRequest) -> AIWorkoutResponse:
        """Parse the AI response and convert to our data model"""
        
        try:
            # Extract JSON from the response (in case there's extra text)
            start_idx = ai_content.find('{')
            end_idx = ai_content.rfind('}') + 1
            
            if start_idx == -1 or end_idx == 0:
                raise ValueError("No valid JSON found in AI response")
            
            json_str = ai_content[start_idx:end_idx]
            data = json.loads(json_str)
            
            # Convert exercises to our Exercise model
            exercises = []
            for ex_data in data.get("exercises", []):
                exercise = Exercise(
                    name=ex_data.get("name", ""),
                    sets=ex_data.get("sets", 3),
                    reps=ex_data.get("reps", 10),
                    rest_seconds=ex_data.get("rest_seconds", 60),
                    notes=ex_data.get("notes", "")
                )
                exercises.append(exercise)
            
            return AIWorkoutResponse(
                title=data.get("title", "AI Generated Workout"),
                description=data.get("description", ""),
                estimated_duration=data.get("estimated_duration", request.duration_minutes or 45),
                difficulty=data.get("difficulty", request.difficulty_level or "intermediate"),
                exercises=exercises,
                tips=data.get("tips", [])
            )
            
        except (json.JSONDecodeError, KeyError, ValueError) as e:
            # Fallback response if parsing fails
            return AIWorkoutResponse(
                title="AI Generated Workout",
                description=f"Workout based on: {request.user_request}",
                estimated_duration=request.duration_minutes or 45,
                difficulty=request.difficulty_level or "intermediate",
                exercises=[
                    Exercise(
                        name="Push-ups",
                        sets=3,
                        reps=10,
                        rest_seconds=60,
                        notes="Keep your core tight and maintain proper form"
                    ),
                    Exercise(
                        name="Squats",
                        sets=3,
                        reps=15,
                        rest_seconds=60,
                        notes="Go down until your thighs are parallel to the floor"
                    ),
                    Exercise(
                        name="Plank",
                        sets=3,
                        reps=1,
                        rest_seconds=60,
                        notes="Hold for 30-60 seconds, keep your body straight"
                    )
                ],
                tips=[
                    "Warm up before starting",
                    "Listen to your body and rest if needed",
                    "Focus on proper form over speed"
                ]
            )
