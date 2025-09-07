from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from ..db import get_session
from ..models import Workout, Exercise, WorkoutLog, ExerciseLog
from ..auth import require_user


router = APIRouter(prefix="/api/workouts", tags=["api:workouts"])


@router.get("")
def api_list(user=Depends(require_user), session=Depends(get_session)):
    ws = session.exec(
        select(Workout).where(Workout.owner_id == user.id).order_by(Workout.created_at.desc())
    ).all()
    return ws


@router.get("/{wid}")
def api_get(wid: int, user=Depends(require_user), session=Depends(get_session)):
    w = session.get(Workout, wid)
    if not w or w.owner_id != user.id:
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
    session.delete(w)
    session.commit()
    return {"ok": True}


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


