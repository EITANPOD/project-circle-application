# Workouts App - Docker Setup

This project is now containerized with three separate Docker containers:
1. **Database** (PostgreSQL)
2. **Backend** (FastAPI)
3. **Frontend** (React)

## Prerequisites

- Docker
- Docker Compose

## Quick Start

1. **Build and start all services:**
   ```bash
   docker-compose up --build
   ```

2. **Access the application:**
   - Application: http://localhost:8080 (nginx reverse proxy)
   - Direct Backend API: http://localhost:8000 (for debugging)
   - Database: localhost:5432

## Service Details

### Database Service
- **Container**: `workouts-db`
- **Port**: 5432
- **Database**: `workouts_db`
- **User**: `workouts_user`
- **Password**: `workouts_password`
- **Volume**: `postgres_data` (persistent data storage)

### Backend Service
- **Container**: `workouts-backend`
- **Port**: 8000
- **Dependencies**: Database service
- **Health Check**: `/healthz` endpoint
- **Environment Variables**:
  - `DB_HOST`: Database host (default: db)
  - `DB_PORT`: Database port (default: 5432)
  - `DB_NAME`: Database name (default: workouts_db)
  - `DB_USER`: Database user (default: workouts_user)
  - `DB_PASSWORD`: Database password (default: workouts_password)
  - `FRONTEND_ORIGIN`: Frontend URL for CORS
  - `ADMIN_TOKEN`: Admin authentication token

### Frontend Service
- **Container**: `workouts-frontend`
- **Port**: 3000
- **Dependencies**: Backend service
- **Build Process**: Uses Vite build system

## Docker Commands

### Start services
```bash
# Start all services in background
docker-compose up -d

# Start with logs
docker-compose up

# Start with rebuild
docker-compose up --build
```

### Stop services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### View logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db
```

### Access containers
```bash
# Access backend container
docker-compose exec backend bash

# Access database container
docker-compose exec db psql -U workouts_user -d workouts_db

# Access frontend container
docker-compose exec frontend sh
```

## Development Workflow

### Hot Reload (Development)
For development with hot reload, you can override the default commands:

```bash
# Backend with hot reload
docker-compose run --service-ports backend uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Frontend with hot reload
docker-compose run --service-ports frontend npm run dev
```

### Environment Variables
Create a `.env` file in the root directory to override default values:

```env
# Database configuration
DB_HOST=db
DB_PORT=5432
DB_NAME=workouts_db
DB_USER=workouts_user
DB_PASSWORD=workouts_password

# Application configuration
ADMIN_TOKEN=your_admin_token
FRONTEND_ORIGIN=http://localhost:3000
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000, 8000, and 5432 are available
2. **Database connection**: Backend waits for database to be healthy before starting
3. **Build failures**: Check Docker logs for specific error messages

### Reset Everything
```bash
# Stop and remove everything
docker-compose down -v --remove-orphans

# Remove all images
docker-compose down --rmi all

# Start fresh
docker-compose up --build
```

### Check Service Status
```bash
# View running containers
docker-compose ps

# Check service health
docker-compose exec backend curl http://localhost:8000/healthz
docker-compose exec db pg_isready -U workouts_user -d workouts_db
```

## Network Configuration

All services communicate through a custom bridge network called `workouts-network`. The backend can reach the database using the hostname `db`, and the frontend can reach the backend using the hostname `backend`.

## Data Persistence

The PostgreSQL data is persisted in a Docker volume called `postgres_data`. This ensures your data survives container restarts and removals.

## Security Notes

- Default admin token is "changeme" - change this in production
- Database credentials are hardcoded for development - use secrets management in production
- Services are exposed on localhost only - configure proper networking for production




