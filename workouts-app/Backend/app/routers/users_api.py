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


