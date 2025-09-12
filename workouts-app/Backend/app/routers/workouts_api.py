import os
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from sqlalchemy.orm import selectinload
from typing import List
from ..db import get_session
from ..models import Workout, Exercise, WorkoutLog, ExerciseLog
from ..auth import require_user
from ..ai_workout_generator import AIWorkoutGenerator, AIWorkoutRequest


router = APIRouter(prefix="/api/workouts", tags=["api:workouts"])


# AI Test endpoint - MUST be before any routes with path parameters
@router.get("/ai-test")
def api_test_ai():
    """Test AI configuration"""
    try:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            return {"status": "error", "message": "GROQ_API_KEY not set"}
        if api_key == "your-groq-api-key-here":
            return {"status": "error", "message": "GROQ_API_KEY is using placeholder value"}
        
        # Test Groq client initialization
        from ..ai_workout_generator import AIWorkoutGenerator
        generator = AIWorkoutGenerator()
        return {"status": "success", "message": "AI configuration is working", "api_key_length": len(api_key)}
    except Exception as e:
        return {"status": "error", "message": f"AI test failed: {str(e)}"}


@router.get("")
def api_list(user=Depends(require_user), session=Depends(get_session)):
    # Get workouts with exercises included
    statement = select(Workout).where(Workout.owner_id == user.id).options(selectinload(Workout.exercises)).order_by(Workout.created_at.desc())
    ws = session.exec(statement).all()
    
    # Debug logging
    print(f"API: Returning {len(ws)} workouts for user {user.id}")
    for i, workout in enumerate(ws):
        print(f"API: Workout {i}: {workout.title}, exercises: {len(workout.exercises) if workout.exercises else 0}")
        if workout.exercises:
            for j, exercise in enumerate(workout.exercises):
                print(f"API:   Exercise {j}: {exercise.name}")
    
    # Convert to dict to ensure proper serialization
    result = []
    for workout in ws:
        workout_dict = {
            "id": workout.id,
            "title": workout.title,
            "notes": workout.notes,
            "created_at": workout.created_at,
            "owner_id": workout.owner_id,
            "exercises": [
                {
                    "id": exercise.id,
                    "name": exercise.name,
                    "sets": exercise.sets,
                    "reps": exercise.reps,
                    "rest_seconds": exercise.rest_seconds,
                    "notes": exercise.notes,
                    "created_at": exercise.created_at,
                    "workout_id": exercise.workout_id
                }
                for exercise in (workout.exercises or [])
            ]
        }
        result.append(workout_dict)
    
    print(f"API: Serialized result has {len(result)} workouts")
    for i, workout in enumerate(result):
        print(f"API: Serialized workout {i}: {workout['title']}, exercises: {len(workout['exercises'])}")
    
    return result


@router.get("/history")
def api_get_workout_history(user=Depends(require_user), session=Depends(get_session)):
    """Get all workout logs for the user with full details"""
    from ..models import WorkoutLog, ExerciseLog, Exercise
    
    # Get all workout logs for the user
    workout_logs = session.exec(
        select(WorkoutLog)
        .join(Workout)
        .where(Workout.owner_id == user.id)
        .order_by(WorkoutLog.workout_date.desc())
    ).all()
    
    # Manually serialize the data to ensure relationships are included
    result = []
    for log in workout_logs:
        print(f"Processing workout log {log.id} for workout {log.workout_id}")
        
        # Load the workout details
        workout = session.get(Workout, log.workout_id)
        print(f"  Workout: {workout.title if workout else 'None'}")
        
        # Load exercise logs with exercise details
        exercise_logs = session.exec(
            select(ExerciseLog)
            .where(ExerciseLog.workout_log_id == log.id)
        ).all()
        print(f"  Found {len(exercise_logs)} exercise logs")
        
        # Load exercise details for each exercise log
        exercise_logs_data = []
        for ex_log in exercise_logs:
            exercise = session.get(Exercise, ex_log.exercise_id)
            exercise_logs_data.append({
                "id": ex_log.id,
                "sets_completed": ex_log.actual_sets,
                "reps_completed": ex_log.actual_reps,
                "weight_used": ex_log.weight,
                "notes": ex_log.notes,
                "exercise": {
                    "id": exercise.id if exercise else 0,
                    "name": exercise.name if exercise else "Unknown Exercise",
                    "sets": exercise.sets if exercise else 0,
                    "reps": exercise.reps if exercise else 0,
                    "rest_seconds": exercise.rest_seconds if exercise else 0
                }
            })
        
        # Create the serialized log entry
        log_data = {
            "id": log.id,
            "workout_date": log.workout_date.isoformat() if log.workout_date else None,
            "notes": log.notes,
            "created_at": log.created_at.isoformat() if log.created_at else None,
            "workout": {
                "id": workout.id if workout else 0,
                "title": workout.title if workout else "Unknown Workout",
                "notes": workout.notes if workout else ""
            },
            "exercise_logs": exercise_logs_data
        }
        
        result.append(log_data)
    
    return result


@router.get("/{wid}")
def api_get(wid: int, user=Depends(require_user), session=Depends(get_session)):
    # Get workout with exercises included
    statement = select(Workout).where(Workout.id == wid, Workout.owner_id == user.id).options(selectinload(Workout.exercises))
    w = session.exec(statement).first()
    if not w:
        raise HTTPException(404)
    return w


@router.post("")
def api_create(item: dict, user=Depends(require_user), session=Depends(get_session)):
    title = (item.get("title") or "").strip()
    notes = item.get("notes")
    if not title:
        raise HTTPException(400, "title required")
    w = Workout(title=title, notes=notes, owner_id=user.id)
    session.add(w)
    session.commit()
    session.refresh(w)
    return w


@router.put("/{wid}")
def api_update(wid: int, item: dict, user=Depends(require_user), session=Depends(get_session)):
    w = session.get(Workout, wid)
    if not w or w.owner_id != user.id:
        raise HTTPException(404)
    w.title = item.get("title", w.title)
    w.notes = item.get("notes", w.notes)
    session.add(w)
    session.commit()
    session.refresh(w)
    return w


@router.delete("/{wid}")
def api_delete(wid: int, user=Depends(require_user), session=Depends(get_session)):
    w = session.get(Workout, wid)
    if not w or w.owner_id != user.id:
        raise HTTPException(404)
    
    try:
        # First, get all exercises for this workout
        from ..models import Exercise
        exercises = session.exec(select(Exercise).where(Exercise.workout_id == wid)).all()
        exercise_ids = [ex.id for ex in exercises]
        
        # Delete all exercise logs that reference these exercises
        from ..models import ExerciseLog
        if exercise_ids:
            exercise_logs = session.exec(select(ExerciseLog).where(ExerciseLog.exercise_id.in_(exercise_ids))).all()
            for ex_log in exercise_logs:
                session.delete(ex_log)
        
        # Delete all workout logs for this workout
        from ..models import WorkoutLog
        workout_logs = session.exec(select(WorkoutLog).where(WorkoutLog.workout_id == wid)).all()
        for log in workout_logs:
            session.delete(log)
        
        # Delete all exercises for this workout
        for exercise in exercises:
            session.delete(exercise)
        
        # Finally delete the workout
        session.delete(w)
        session.commit()
        return {"ok": True}
        
    except Exception as e:
        session.rollback()
        print(f"Error deleting workout {wid}: {e}")
        raise HTTPException(500, f"Error deleting workout: {str(e)}")


# Exercise endpoints
@router.get("/{wid}/exercises")
def api_list_exercises(wid: int, user=Depends(require_user), session=Depends(get_session)):
    w = session.get(Workout, wid)
    if not w or w.owner_id != user.id:
        raise HTTPException(404)
    exercises = session.exec(
        select(Exercise).where(Exercise.workout_id == wid).order_by(Exercise.created_at.asc())
    ).all()
    return exercises


@router.post("/{wid}/exercises")
def api_create_exercise(wid: int, item: dict, user=Depends(require_user), session=Depends(get_session)):
    w = session.get(Workout, wid)
    if not w or w.owner_id != user.id:
        raise HTTPException(404)
    
    name = (item.get("name") or "").strip()
    sets = item.get("sets", 0)
    reps = item.get("reps", 0)
    rest_seconds = item.get("rest_seconds", 60)
    notes = item.get("notes")
    
    if not name or sets <= 0 or reps <= 0:
        raise HTTPException(400, "name, sets, and reps required")
    
    e = Exercise(
        name=name, sets=sets, reps=reps, rest_seconds=rest_seconds, 
        notes=notes, workout_id=wid
    )
    session.add(e)
    session.commit()
    session.refresh(e)
    return e


@router.put("/{wid}/exercises/{eid}")
def api_update_exercise(wid: int, eid: int, item: dict, user=Depends(require_user), session=Depends(get_session)):
    w = session.get(Workout, wid)
    if not w or w.owner_id != user.id:
        raise HTTPException(404)
    
    e = session.get(Exercise, eid)
    if not e or e.workout_id != wid:
        raise HTTPException(404)
    
    e.name = item.get("name", e.name)
    e.sets = item.get("sets", e.sets)
    e.reps = item.get("reps", e.reps)
    e.rest_seconds = item.get("rest_seconds", e.rest_seconds)
    e.notes = item.get("notes", e.notes)
    
    session.add(e)
    session.commit()
    session.refresh(e)
    return e


@router.delete("/{wid}/exercises/{eid}")
def api_delete_exercise(wid: int, eid: int, user=Depends(require_user), session=Depends(get_session)):
    w = session.get(Workout, wid)
    if not w or w.owner_id != user.id:
        raise HTTPException(404)
    
    e = session.get(Exercise, eid)
    if not e or e.workout_id != wid:
        raise HTTPException(404)
    
    session.delete(e)
    session.commit()
    return {"ok": True}


# Workout logging endpoints
@router.post("/{wid}/log")
def api_log_workout(wid: int, item: dict, user=Depends(require_user), session=Depends(get_session)):
    w = session.get(Workout, wid)
    if not w or w.owner_id != user.id:
        raise HTTPException(404)
    
    # Create workout log
    workout_log = WorkoutLog(
        workout_id=wid,
        notes=item.get("notes")
    )
    session.add(workout_log)
    session.commit()
    session.refresh(workout_log)
    
    # Add exercise logs
    exercise_logs = item.get("exercise_logs", [])
    print(f"Received exercise logs: {exercise_logs}")  # Debug log
    
    for log_data in exercise_logs:
        exercise_id = log_data.get("exercise_id")
        actual_sets = log_data.get("actual_sets", 0)
        actual_reps = log_data.get("actual_reps", 0)
        weight = log_data.get("weight")
        notes = log_data.get("notes")
        
        print(f"Processing exercise log: exercise_id={exercise_id}, sets={actual_sets}, reps={actual_reps}")  # Debug log
        
        # Create exercise log even if sets/reps are 0 (user might want to record notes or weight)
        if exercise_id is not None:
            exercise_log = ExerciseLog(
                exercise_id=exercise_id,
                workout_log_id=workout_log.id,
                actual_sets=actual_sets,
                actual_reps=actual_reps,
                weight=weight,
                notes=notes
            )
            session.add(exercise_log)
            print(f"Added exercise log: {exercise_log}")  # Debug log
    
    session.commit()
    return {"id": workout_log.id, "message": "Workout logged successfully"}


@router.get("/{wid}/logs")
def api_get_workout_logs(wid: int, user=Depends(require_user), session=Depends(get_session)):
    w = session.get(Workout, wid)
    if not w or w.owner_id != user.id:
        raise HTTPException(404)
    
    logs = session.exec(
        select(WorkoutLog).where(WorkoutLog.workout_id == wid).order_by(WorkoutLog.workout_date.desc())
    ).all()
    
    # Build response with explicit exercise logs
    response_logs = []
    for log in logs:
        print(f"Looking for exercise logs for workout log ID: {log.id}")
        exercise_logs = session.exec(
            select(ExerciseLog).where(ExerciseLog.workout_log_id == log.id)
        ).all()
        print(f"Found {len(exercise_logs)} exercise logs for workout log {log.id}")
        for ex_log in exercise_logs:
            print(f"  - Exercise log: ID={ex_log.id}, exercise_id={ex_log.exercise_id}, sets={ex_log.actual_sets}, reps={ex_log.actual_reps}")
        
        # Create response object with explicit exercise_logs
        log_dict = {
            "id": log.id,
            "workout_date": log.workout_date,
            "notes": log.notes,
            "created_at": log.created_at,
            "workout_id": log.workout_id,
            "exercise_logs": [
                {
                    "id": ex_log.id,
                    "exercise_id": ex_log.exercise_id,
                    "actual_sets": ex_log.actual_sets,
                    "actual_reps": ex_log.actual_reps,
                    "weight": ex_log.weight,
                    "notes": ex_log.notes,
                    "created_at": ex_log.created_at,
                    "workout_log_id": ex_log.workout_log_id
                }
                for ex_log in exercise_logs
            ]
        }
        response_logs.append(log_dict)
    
    return response_logs


# AI Workout Generation endpoint
@router.post("/ai-generate")
def api_generate_ai_workout(request: AIWorkoutRequest, user=Depends(require_user)):
    """Generate a workout using AI based on user request"""
    try:
        generator = AIWorkoutGenerator()
        ai_workout = generator.generate_workout(request)
        return ai_workout
    except ValueError as e:
        # API key not set or invalid
        raise HTTPException(400, f"Configuration error: {str(e)}")
    except Exception as e:
        # Log the full error for debugging
        print(f"AI Workout Generation Error: {str(e)}")
        raise HTTPException(500, f"Failed to generate workout: {str(e)}")


@router.post("/ai-generate-and-save")
def api_generate_and_save_ai_workout(request: AIWorkoutRequest, user=Depends(require_user), session=Depends(get_session)):
    """Generate a workout using AI and save it to the database"""
    try:
        generator = AIWorkoutGenerator()
        ai_workout = generator.generate_workout(request)
        
        # Create the workout in the database
        workout = Workout(
            title=ai_workout.title,
            notes=ai_workout.description,
            owner_id=user.id
        )
        session.add(workout)
        session.commit()
        session.refresh(workout)
        
        # Add exercises to the workout
        for exercise_data in ai_workout.exercises:
            exercise = Exercise(
                name=exercise_data.name,
                sets=exercise_data.sets,
                reps=exercise_data.reps,
                rest_seconds=exercise_data.rest_seconds,
                notes=exercise_data.notes,
                workout_id=workout.id
            )
            session.add(exercise)
        
        session.commit()
        
        # Return the created workout with exercises
        created_exercises = session.exec(
            select(Exercise).where(Exercise.workout_id == workout.id).order_by(Exercise.created_at.asc())
        ).all()
        
        workout.exercises = created_exercises
        return {
            "workout": workout,
            "ai_metadata": {
                "estimated_duration": ai_workout.estimated_duration,
                "difficulty": ai_workout.difficulty,
                "tips": ai_workout.tips
            }
        }
        
    except Exception as e:
        raise HTTPException(500, f"Failed to generate and save workout: {str(e)}")


