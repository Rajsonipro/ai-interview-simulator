import random
import string
import time
import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
from sqlite3 import Connection
from collections import defaultdict
from fastapi import Depends, Header, HTTPException, Request
from app.database.db import get_db
from app.models.schemas import UserResponse

SESSION_TOKEN_LENGTH = 64
SESSION_EXPIRE_HOURS = 24
OTP_LENGTH = 6
OTP_EXPIRE_MINUTES = 10
MAX_OTP_ATTEMPTS = 5
BCRYPT_ROUNDS = 12

# ─────────────────────────────────────────────
# In-memory rate limiter (simple token bucket)
# ─────────────────────────────────────────────

class RateLimiter:
    def __init__(self):
        self._buckets: dict = defaultdict(lambda: {"tokens": 0, "last_refill": 0.0})

    def check(self, key: str, max_requests: int = 5, window_seconds: int = 60) -> bool:
        now = time.time()
        bucket = self._buckets[key]
        # Refill tokens
        elapsed = now - bucket["last_refill"]
        bucket["tokens"] = min(max_requests, bucket["tokens"] + elapsed * (max_requests / window_seconds))
        bucket["last_refill"] = now

        if bucket["tokens"] >= 1:
            bucket["tokens"] -= 1
            return True
        return False

rate_limiter = RateLimiter()

def check_rate_limit(request: Request, key_prefix: str = "default", max_requests: int = 5, window: int = 60):
    """Dependency for rate limiting endpoints."""
    client_ip = request.client.host if request.client else "unknown"
    rate_key = f"{key_prefix}:{client_ip}"
    if not rate_limiter.check(rate_key, max_requests, window):
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please try again later."
        )

# ─────────────────────────────────────────────
# Password Hashing
# ─────────────────────────────────────────────

def hash_password(password: str) -> str:
    """Hash a password with bcrypt."""
    salt = bcrypt.gensalt(rounds=BCRYPT_ROUNDS)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def validate_password_strength(password: str) -> Tuple[bool, str]:
    """Validate password strength requirements."""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not any(c.isupper() for c in password):
        return False, "Password must contain at least one uppercase letter"
    if not any(c.islower() for c in password):
        return False, "Password must contain at least one lowercase letter"
    if not any(c.isdigit() for c in password):
        return False, "Password must contain at least one number"
    if not any(c in "!@#$%^&*()_+-=[]{}|;':\",./<>?`~" for c in password):
        return False, "Password must contain at least one special character"
    return True, ""


# ─────────────────────────────────────────────
# OTP Generation
# ─────────────────────────────────────────────

def generate_otp(length: int = OTP_LENGTH) -> str:
    """Generate a numeric OTP of given length."""
    return ''.join(random.choices(string.digits, k=length))


def get_otp_expiry(minutes: int = OTP_EXPIRE_MINUTES) -> datetime:
    """Get expiry datetime for OTP."""
    return datetime.now(timezone.utc) + timedelta(minutes=minutes)


def verify_otp_not_expired(expiry_str: Optional[str]) -> bool:
    """Check if OTP expiry time is still valid."""
    if not expiry_str:
        return False
    try:
        expiry = datetime.fromisoformat(expiry_str.replace('Z', '+00:00'))
        return expiry > datetime.now(timezone.utc)
    except Exception:
        return False


# ─────────────────────────────────────────────
# Session Token Management
# ─────────────────────────────────────────────

def generate_session_token() -> str:
    """Generate a cryptographically random session token."""
    return ''.join(random.choices(string.ascii_letters + string.digits, k=SESSION_TOKEN_LENGTH))


def get_session_expiry() -> datetime:
    """Get expiry datetime for session token."""
    return datetime.now(timezone.utc) + timedelta(hours=SESSION_EXPIRE_HOURS)


def verify_session_token(db: Connection, token: str) -> Optional[Tuple[int, dict]]:
    """Verify a session token and return (user_id, user_dict) or None."""
    cursor = db.cursor()
    cursor.execute("""
        SELECT * FROM users 
        WHERE session_token = ? AND session_expiry > datetime('now')
    """, (token,))

    user_row = cursor.fetchone()
    if user_row:
        return user_row['id'], dict(user_row)
    return None


def invalidate_session(db: Connection, user_id: int):
    """Invalidate the current session token for a user."""
    cursor = db.cursor()
    cursor.execute(
        "UPDATE users SET session_token = NULL, session_expiry = NULL WHERE id = ?",
        (user_id,)
    )
    db.commit()


# ─────────────────────────────────────────────
# OAuth Session Token (for callback redirect)
# ─────────────────────────────────────────────

def create_oauth_session_token(db: Connection, user_id: int) -> str:
    """Create a new session token for OAuth users and return it."""
    session_token = generate_session_token()
    session_expiry = get_session_expiry()
    cursor = db.cursor()
    cursor.execute(
        "UPDATE users SET session_token = ?, session_expiry = ? WHERE id = ?",
        (session_token, session_expiry, user_id)
    )
    db.commit()
    return session_token


# ─────────────────────────────────────────────
# FastAPI Dependencies
# ─────────────────────────────────────────────

async def get_current_user(
    db: Connection = Depends(get_db),
    x_session_token: str = Header(None, alias="X-Session-Token")
) -> UserResponse:
    """Get the current authenticated user from session token header."""
    if not x_session_token:
        raise HTTPException(status_code=401, detail="Authentication required. Please log in.")
    verified = verify_session_token(db, x_session_token)
    if not verified:
        raise HTTPException(status_code=401, detail="Session expired or invalid. Please log in again.")
    _, user_dict = verified
    if not user_dict.get("is_verified"):
        raise HTTPException(status_code=403, detail="Email not verified. Please verify your email first.")
    return UserResponse(**user_dict)
