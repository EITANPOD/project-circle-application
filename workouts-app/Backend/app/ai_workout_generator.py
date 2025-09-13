import os
import json
from typing import Dict, List, Optional
from groq import Groq
from pydantic import BaseModel

class AIWorkoutRequest(BaseModel):
    # New structured approach
    num_exercises: Optional[int] = None  # 1-12, None means "let AI decide"
    duration_minutes: int = 30
    workout_type: str = "full_body"  # full_body, upper_body, lower_body, core, cardio, strength, flexibility
    difficulty_level: str = "intermediate"  # beginner, intermediate, advanced
    equipment_available: Optional[List[str]] = None
    focus_areas: Optional[List[str]] = None
    custom_notes: Optional[str] = None  # Optional additional notes
    
    # Keep old field for backward compatibility
    user_request: Optional[str] = None

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
        """Build the prompt for Groq AI based on structured parameters"""
        
        # Use structured approach if available, fallback to user_request for backward compatibility
        if request.user_request and not any([request.num_exercises, request.workout_type != "full_body", request.difficulty_level != "intermediate"]):
            # Legacy mode - use user_request
            prompt_parts = [f"Create a workout plan based on this request: '{request.user_request}'"]
        else:
            # New structured mode
            prompt_parts = ["Create a workout plan with the following specifications:"]
        
        # Add structured parameters
        if request.num_exercises:
            prompt_parts.append(f"Number of exercises: {request.num_exercises}")
        else:
            prompt_parts.append("Number of exercises: Let AI decide (4-8 exercises)")
        
        prompt_parts.append(f"Duration: {request.duration_minutes} minutes")
        prompt_parts.append(f"Workout type: {request.workout_type}")
        prompt_parts.append(f"Difficulty level: {request.difficulty_level}")
        
        if request.equipment_available:
            prompt_parts.append(f"Available equipment: {', '.join(request.equipment_available)}")
        else:
            prompt_parts.append("Available equipment: Bodyweight only")
        
        if request.focus_areas:
            prompt_parts.append(f"Focus areas: {', '.join(request.focus_areas)}")
        
        if request.custom_notes:
            prompt_parts.append(f"Additional notes: {request.custom_notes}")
        
        prompt_parts.extend([
            "",
            "IMPORTANT: You MUST respond with ONLY valid JSON in this exact format. Do not include any text before or after the JSON:",
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
            "CRITICAL REQUIREMENTS:",
            "1. Respond with ONLY the JSON object, no other text",
            "2. Include 4-8 exercises based on the user's request",
            "3. Make sure all JSON is valid and properly formatted",
            "4. Each exercise must have name, sets, reps, rest_seconds, and notes",
            "5. The workout must be safe, effective, and match the user's request"
        ])
        
        return "\n".join(prompt_parts)
    
    def _parse_ai_response(self, ai_content: str, request: AIWorkoutRequest) -> AIWorkoutResponse:
        """Parse the AI response and convert to our data model"""
        
        try:
            # Debug: Log the AI response
            print(f"DEBUG: AI Response content: {ai_content[:500]}...")
            
            # Extract JSON from the response (in case there's extra text)
            start_idx = ai_content.find('{')
            end_idx = ai_content.rfind('}') + 1
            
            if start_idx == -1 or end_idx == 0:
                print("DEBUG: No JSON found in AI response")
                raise ValueError("No valid JSON found in AI response")
            
            json_str = ai_content[start_idx:end_idx]
            print(f"DEBUG: Extracted JSON: {json_str}")
            
            data = json.loads(json_str)
            print(f"DEBUG: Parsed data: {data}")
            
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
            # Debug: Log the parsing error
            print(f"DEBUG: Parsing failed with error: {e}")
            print(f"DEBUG: AI Response that failed: {ai_content}")
            
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
