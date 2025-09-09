# 🤖 AI Workout Planner Feature

This feature adds AI-powered workout generation to the workouts app using Groq's Llama models.

## ✨ Features

- **AI Workout Generation**: Describe your ideal workout and let AI create a personalized plan
- **Smart Customization**: Set workout type, duration, difficulty level, and more
- **Preview & Save**: Preview AI-generated workouts before saving them
- **Professional UI**: Beautiful modals and cards for seamless user experience
- **Docker & Kubernetes Ready**: Works with both Docker Compose and Kubernetes deployments

## 🚀 How It Works

1. **User Input**: Users describe their workout preferences in natural language
2. **AI Processing**: Groq Llama models generate a structured workout plan
3. **Smart Parsing**: The system parses AI response into structured data
4. **Preview & Save**: Users can preview the workout before saving it to their collection

## 🛠 Technical Implementation

### Backend
- **AI Service**: `ai_workout_generator.py` - Handles Groq API integration
- **API Endpoints**: 
  - `POST /api/workouts/ai-generate` - Generate workout preview
  - `POST /api/workouts/ai-generate-and-save` - Generate and save workout
- **Dependencies**: Added `groq>=0.4.1` to requirements.txt

### Frontend
- **AI Modal**: Beautiful modal for workout generation input
- **Preview Modal**: Shows AI-generated workout before saving
- **Integration**: Seamlessly integrated into existing workouts page

### Infrastructure
- **Docker Compose**: Added `GROQ_API_KEY` environment variable
- **Kubernetes**: Added Groq API key to external secrets and deployment

## 🔧 Setup Instructions

### 1. Get Groq API Key
1. Go to [Groq Console](https://console.groq.com/)
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `gsk_`)

### 2. Docker Compose Setup
```bash
# Set your Groq API key
export GROQ_API_KEY="your-groq-api-key-here"

# Run the application
docker-compose up --build
```

### 3. Kubernetes Setup
Add the Groq API key to your AWS Secrets Manager:
```bash
# Add to your existing secret in AWS Secrets Manager
aws secretsmanager update-secret \
  --secret-id postgres-circle \
  --secret-string '{"DB_PASSWORD":"your-db-password","DB_USER":"your-db-user","ADMIN_TOKEN":"your-admin-token","GROQ_API_KEY":"your-groq-api-key"}'
```

## 💡 Usage Examples

### Basic Workout Generation
```
"I want a 30-minute upper body workout for beginners with no equipment"
```

### Advanced Customization
- **Workout Type**: Strength Training, Cardio, HIIT, Yoga, etc.
- **Duration**: 10-120 minutes
- **Difficulty**: Beginner, Intermediate, Advanced
- **Equipment**: Specify available equipment
- **Focus Areas**: Target specific muscle groups

### Example AI Responses
The AI generates structured workouts with:
- Exercise names and descriptions
- Sets, reps, and rest periods
- Form tips and variations
- Workout tips and safety notes

## 🎨 UI Features

- **🤖 Generate with AI Button**: Prominent purple gradient button
- **Smart Modal**: Intuitive form with dropdowns and text areas
- **Preview System**: Beautiful preview of AI-generated workouts
- **Responsive Design**: Works perfectly on mobile and desktop
- **Loading States**: Smooth loading indicators during AI generation

## 🔒 Security

- **API Key Protection**: Groq API key stored as environment variable
- **User Authentication**: Only authenticated users can generate workouts
- **Input Validation**: All user inputs are validated before sending to AI
- **Error Handling**: Graceful fallbacks if AI generation fails

## 📊 Cost Considerations

- **Groq Pricing**: Free tier available, very affordable for production use
- **Token Usage**: ~500-1000 tokens per workout generation
- **Monthly Cost**: Typically under $5 for moderate usage

## 🚀 Future Enhancements

- **Workout History Analysis**: AI learns from user's workout history
- **Personalized Recommendations**: More tailored workout suggestions
- **Exercise Variations**: AI suggests exercise alternatives
- **Progress Tracking**: AI analyzes workout progress and suggests improvements

## 🐛 Troubleshooting

### Common Issues
1. **API Key Not Set**: Ensure `GROQ_API_KEY` is properly configured
2. **Network Issues**: Check internet connection for Groq API calls
3. **Rate Limits**: Groq has rate limits, wait a moment and try again
4. **Invalid Response**: AI sometimes returns malformed JSON, fallback workout is provided

### Debug Mode
Enable debug logging by checking browser console for detailed error messages.

## 📝 API Reference

### Generate Workout Preview
```http
POST /api/workouts/ai-generate
Content-Type: application/json

{
  "user_request": "I want a 30-minute cardio workout",
  "workout_type": "cardio",
  "duration_minutes": 30,
  "difficulty_level": "intermediate",
  "equipment_available": [],
  "focus_areas": []
}
```

### Generate and Save Workout
```http
POST /api/workouts/ai-generate-and-save
Content-Type: application/json

{
  "user_request": "I want a 30-minute cardio workout",
  "workout_type": "cardio",
  "duration_minutes": 30,
  "difficulty_level": "intermediate",
  "equipment_available": [],
  "focus_areas": []
}
```

## 🎉 Success!

The AI Workout Planner is now fully integrated and ready to use! Users can generate personalized workouts with just a few clicks, making fitness planning more accessible and engaging than ever before.
