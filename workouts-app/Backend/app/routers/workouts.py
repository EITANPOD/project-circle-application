from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from ..db import get_session
from ..models import Workout
from ..auth import require_user

api = APIRouter(prefix="/api/workouts", tags=["api:workouts"])

@api.get("")
def api_list(user=Depends(require_user), session=Depends(get_session)):
    ws = session.exec(select(Workout).where(Workout.owner_id == user.id).order_by(Workout.created_at.desc())).all()
    return ws

@api.post("")
def api_create(item: dict, user=Depends(require_user), session=Depends(get_session)):
    title = item.get("title","").strip()
    notes = item.get("notes","")
    if not title: raise HTTPException(400, "title required")
    w = Workout(title=title, notes=notes, owner_id=user.id)
    session.add(w); session.commit(); session.refresh(w)
    return w

@api.put("/{wid}")
def api_update(wid: int, item: dict, user=Depends(require_user), session=Depends(get_session)):
    w = session.get(Workout, wid)
    if not w or w.owner_id != user.id: raise HTTPException(404)
    w.title = item.get("title", w.title)
    w.notes = item.get("notes", w.notes)
    session.add(w); session.commit(); session.refresh(w)
    return w

@api.delete("/{wid}")
def api_delete(wid: int, user=Depends(require_user), session=Depends(get_session)):
    w = session.get(Workout, wid)
    if not w or w.owner_id != user.id: raise HTTPException(404)
    session.delete(w); session.commit()
    return {"ok": True}
