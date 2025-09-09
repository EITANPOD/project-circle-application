## Start

This application can be run in **two ways**:
1. **🐳 Docker** - Full containerized setup 
2. **💻 Local Development** - Traditional local development setup

---

## Method 1: Docker Setup 

### Prerequisites
- Docker Desktop installed and running (i used it)
- Git (to clone the repository)

### How to Run
1. **Navigate to project directory:**
   ```bash
   cd workouts-app
   ```

2. **Start all services:**
   ```bash
   docker-compose up -d
   ```

3. **Access the application:**
   - **Application**: http://localhost:8080
   - **Backend API docs**: http://localhost:8080/docs
   - **Database**: PostgreSQL on localhost:5432

### Docker Commands
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs

# Rebuild and start
docker-compose up --build

# Check status
docker-compose ps
```

### Architecture
- **Database**: PostgreSQL in container
- **Backend**: FastAPI with bcrypt password hashing
- **Frontend**: React built with Vite
- **Reverse Proxy**: Nginx routes requests between services

---

## Method 2: Local Development

### Prerequisites
- Python 3.8+ installed
- Node.js 18+ installed
- Git (to clone the repository)

### Backend Setup
1. **Navigate to backend directory:**
   ```cmd
   cd workouts-app\Backend
   ```

2. **Create virtual environment:**
   ```cmd
   python -m venv venv
   venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```cmd
   python -m pip install --upgrade pip
   pip install -r app\requirements.txt
   ```

4. **Start backend server:**
   ```cmd
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Setup
**Open a new terminal window:**

1. **Navigate to frontend directory:**
   ```cmd
   cd workouts-app\Frontend
   ```

2. **Install dependencies:**
   ```cmd
   npm install
   ```

3. **Start development server:**
   ```cmd
   npm run dev
   ```

### Access Local Development
- **Application**: http://localhost:5173
- **Backend API docs**: http://localhost:8000/docs

### Database
Local development uses **SQLite** database (no setup required)

---

## Security Features

### Docker (Production-like)
- ✅ bcrypt password hashing
- ✅ PostgreSQL database
- ✅ Container isolation
- ✅ Environment variables
- ✅ Health checks

### Local Development
- ✅ SHA256 password hashing
- ✅ SQLite database
- ✅ Hot reload for development
- ✅ Fast startup

---

## Features

- **User Authentication**: Signup, login, logout
- **Workout Management**: Create, view, delete workouts
- **Exercise Tracking**: Add exercises to workouts
- **Workout Logging**: Track completed workouts
- **Responsive Design**: Works on desktop and mobile

---

## Development

### Adding New Features
1. **Backend**: Add routes in `Backend/app/routers/`
2. **Frontend**: Add components in `Frontend/src/pages/`
3. **Database**: Update models in `Backend/app/models.py`

### File Structure
```
workouts-app/
├── Backend/
│   ├── app/
│   │   ├── routers/        # API endpoints
│   │   ├── models.py       # Database models
│   │   ├── auth.py         # Authentication
│   │   └── main.py         # FastAPI app
│   ├── Dockerfile
│   └── requirements*.txt
├── Frontend/
│   ├── src/
│   │   ├── pages/          # React components
│   │   └── main.tsx        # App entry point
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml      # Docker orchestration
├── Dockerfile.db          # Database container
├── Dockerfile.nginx       # Reverse proxy
└── README.md
```

---

## Troubleshooting

### Docker Issues
- **Port conflicts**: Make sure ports 8080, 8000, 5432 are available
- **Container won't start**: Check `docker-compose logs`
- **Database connection**: Wait for database health check to pass

### Local Development Issues
- **Python errors**: Make sure virtual environment is activated
- **bcrypt errors**: Install bcrypt separately if needed: `pip install bcrypt`
- **Port 5173 in use**: Kill other Vite processes

### Common Solutions
```bash
# Reset Docker completely
docker-compose down -v --remove-orphans
docker-compose up --build

# Reset local backend
cd Backend
rmdir /s venv
python -m venv venv
venv\Scripts\activate
pip install -r app\requirements.txt
```

---




## Summary

- **🐳 Docker**: `docker-compose up -d` → http://localhost:8080
- **💻 Local**: Backend + Frontend servers → http://localhost:5173


