import os
import hashlib
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, Request
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from sqlmodel import select
from .db import get_session
from .models import User

# Try to use bcrypt if available (Docker), fallback to simple hashing (local)
try:
    from passlib.context import CryptContext
    import bcrypt  # Check if bcrypt is actually available
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    USE_BCRYPT = True
except (ImportError, Exception):
    USE_BCRYPT = False
    pwd_context = None


def get_secret_key() -> str:
    return os.getenv("SECRET_KEY", "dev-secret-change-me")


def get_serializer() -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(get_secret_key(), salt="auth-token")


def hash_password(password: str) -> str:
    if USE_BCRYPT:
        return pwd_context.hash(password)
    else:
        # Simple SHA256 hashing for local development
        salt = get_secret_key()
        return hashlib.sha256((password + salt).encode()).hexdigest()


def _looks_like_bcrypt(hash_value: str) -> bool:
    return isinstance(hash_value, str) and hash_value.startswith(("$2a$", "$2b$", "$2y$"))


def verify_password(password: str, password_hash: str) -> bool:
    # Support legacy/local SHA256 hashes and bcrypt hashes side-by-side
    if _looks_like_bcrypt(password_hash):
        if USE_BCRYPT and pwd_context is not None:
            try:
                return pwd_context.verify(password, password_hash)
            except Exception:
                return False
        # bcrypt hash present but bcrypt backend not available locally
        return False
    # Fallback/legacy SHA256 verification
    return hash_password(password) == password_hash


def create_session_cookie(user_id: int, expires_minutes: int = 60 * 24) -> str:
    s = get_serializer()
    token = s.dumps({"uid": user_id, "ts": datetime.utcnow().timestamp()})
    return token


def decode_session_cookie(token: str) -> Optional[int]:
    s = get_serializer()
    try:
        data = s.loads(token, max_age=60 * 60 * 24 * 7)
        return int(data.get("uid"))
    except (BadSignature, SignatureExpired):
        return None


def require_user(request: Request, session=Depends(get_session)) -> User:
    token = request.cookies.get("session") or request.headers.get("x-session")
    user_id = decode_session_cookie(token) if token else None
    if not user_id:
        raise HTTPException(401, "Authentication required")
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(401, "Invalid session")
    return user


