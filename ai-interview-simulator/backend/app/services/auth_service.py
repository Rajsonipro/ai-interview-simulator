import os
import jwt
import random
import string
import smtplib
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from typing import Optional

SECRET_KEY = os.getenv("SECRET_KEY", "ai-interview-simulator-secret-key-2024")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

import bcrypt

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def generate_otp(length: int = 6) -> str:
    return ''.join(random.choices(string.digits, k=length))


def get_otp_expiry(minutes: int = 10) -> datetime:
    return datetime.now(timezone.utc) + timedelta(minutes=minutes)


def send_verification_email(email: str, otp: str) -> None:
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    sender_email = os.getenv("SMTP_SENDER_EMAIL", smtp_username or "")

    if not smtp_username or not smtp_password or not sender_email:
        raise RuntimeError(
            "SMTP credentials are missing. Set SMTP_USERNAME, SMTP_PASSWORD, and SMTP_SENDER_EMAIL."
        )

    message = EmailMessage()
    message["Subject"] = "Intervia AI sends your verification code for registration"
    message["From"] = f"Intervia AI <{sender_email}>"
    message["To"] = email
    message.set_content(
        f"""Hi,

Intervia AI sends your verification code for registration.

Verification Code: {otp}

This code will expire in 10 minutes.
If you did not request this, you can ignore this email.
"""
    )

    with smtplib.SMTP(smtp_host, smtp_port, timeout=20) as server:
        server.starttls()
        server.login(smtp_username, smtp_password)
        server.send_message(message)
