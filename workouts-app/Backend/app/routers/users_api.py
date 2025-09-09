from fastapi import APIRouter, Depends, HTTPException, Response
from sqlmodel import select
from ..db import get_session
from ..models import User
from ..auth import hash_password, verify_password, create_session_cookie, require_user


router = APIRouter(prefix="/api/users", tags=["api:users"])


@router.post("/register")
def register(item: dict, response: Response, session=Depends(get_session)):
    email = (item.get("email") or "").strip().lower()
    password = item.get("password") or ""
    full_name = item.get("full_name")
    if not email or not password:
        raise HTTPException(400, "email and password required")
    existing = session.exec(select(User).where(User.email == email)).first()
    if existing:
        raise HTTPException(400, "email already registered")
    user = User(email=email, password_hash=hash_password(password), full_name=full_name)
    session.add(user)
    session.commit()
    session.refresh(user)
    token = create_session_cookie(user.id)
    response.set_cookie("session", token, httponly=True, samesite="lax")
    return {"id": user.id, "email": user.email, "full_name": user.full_name}


@router.post("/login")
def login(item: dict, response: Response, session=Depends(get_session)):
    email = (item.get("email") or "").strip().lower()
    password = item.get("password") or ""
    user = session.exec(select(User).where(User.email == email)).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(401, "bad credentials")
    token = create_session_cookie(user.id)
    response.set_cookie("session", token, httponly=True, samesite="lax")
    return {"id": user.id, "email": user.email, "full_name": user.full_name}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("session")
    return {"ok": True}


@router.get("/me")
def me(user=Depends(require_user)):
    return {"id": user.id, "email": user.email, "full_name": user.full_name}


@router.put("/profile")
def update_profile(item: dict, user=Depends(require_user), session=Depends(get_session)):
    """Update user profile information (name and email)"""
    full_name = item.get("full_name")
    email = (item.get("email") or "").strip().lower()
    
    if not email:
        raise HTTPException(400, "email is required")
    
    # Check if email is already taken by another user
    if email != user.email:
        existing = session.exec(select(User).where(User.email == email)).first()
        if existing:
            raise HTTPException(400, "email already taken")
    
    # Update user data
    user.full_name = full_name
    user.email = email
    session.add(user)
    session.commit()
    session.refresh(user)
    
    return {"id": user.id, "email": user.email, "full_name": user.full_name}


@router.put("/password")
def update_password(item: dict, user=Depends(require_user), session=Depends(get_session)):
    """Update user password"""
    current_password = item.get("current_password")
    new_password = item.get("new_password")
    
    if not current_password or not new_password:
        raise HTTPException(400, "current_password and new_password are required")
    
    if len(new_password) < 6:
        raise HTTPException(400, "new password must be at least 6 characters")
    
    # Verify current password
    if not verify_password(current_password, user.password_hash):
        raise HTTPException(400, "current password is incorrect")
    
    # Update password
    user.password_hash = hash_password(new_password)
    session.add(user)
    session.commit()
    
    return {"ok": True}


@router.put("/preferences")
def update_preferences(item: dict, user=Depends(require_user), session=Depends(get_session)):
    """Update user preferences"""
    # For now, just return success since we don't have preferences in the model yet
    # In a real app, you'd store these in a separate preferences table or JSON field
    return {"ok": True}


@router.delete("/account")
def delete_account(user=Depends(require_user), session=Depends(get_session)):
    """Delete user account"""
    # Delete all user's workouts and related data first
    from ..models import Workout, Exercise, WorkoutLog, ExerciseLog
    
    # Get all workouts for this user
    workouts = session.exec(select(Workout).where(Workout.user_id == user.id)).all()
    
    for workout in workouts:
        # Delete exercise logs
        exercise_logs = session.exec(select(ExerciseLog).join(WorkoutLog).where(WorkoutLog.workout_id == workout.id)).all()
        for log in exercise_logs:
            session.delete(log)
        
        # Delete workout logs
        workout_logs = session.exec(select(WorkoutLog).where(WorkoutLog.workout_id == workout.id)).all()
        for log in workout_logs:
            session.delete(log)
        
        # Delete exercises
        exercises = session.exec(select(Exercise).where(Exercise.workout_id == workout.id)).all()
        for exercise in exercises:
            session.delete(exercise)
        
        # Delete workout
        session.delete(workout)
    
    # Delete user
    session.delete(user)
    session.commit()
    
    return {"ok": True}


