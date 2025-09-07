from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    password_hash: str
    full_name: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    workouts: List["Workout"] = Relationship(back_populates="owner")


class Workout(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    owner_id: int = Field(foreign_key="user.id")
    owner: Optional[User] = Relationship(back_populates="workouts")
    exercises: List["Exercise"] = Relationship(back_populates="workout")
    logs: List["WorkoutLog"] = Relationship(back_populates="workout")


class Exercise(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    sets: int
    reps: int
    rest_seconds: int = Field(default=60)  # rest time in seconds
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    workout_id: int = Field(foreign_key="workout.id")
    workout: Optional[Workout] = Relationship(back_populates="exercises")
    logs: List["ExerciseLog"] = Relationship(back_populates="exercise")


class WorkoutLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    workout_date: datetime = Field(default_factory=datetime.utcnow)
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    workout_id: int = Field(foreign_key="workout.id")
    workout: Optional[Workout] = Relationship(back_populates="logs")
    exercise_logs: List["ExerciseLog"] = Relationship(back_populates="workout_log")


class ExerciseLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    actual_sets: int
    actual_reps: int
    weight: Optional[float] = None  # weight used in kg/lbs
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    exercise_id: int = Field(foreign_key="exercise.id")
    exercise: Optional[Exercise] = Relationship(back_populates="logs")
    workout_log_id: int = Field(foreign_key="workoutlog.id")
    workout_log: Optional[WorkoutLog] = Relationship(back_populates="exercise_logs")


