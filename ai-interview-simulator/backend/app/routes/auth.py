from fastapi import APIRouter, HTTPException, Depends, Request
from sqlite3 import Connection, IntegrityError
from app.database.db import get_db
from app.models.schemas import (
    UserRegister, UserLogin, OTPVerify, OTPResend,
    ForgotPasswordRequest, ForgotPasswordVerify, ResetPassword,
    AuthResponse, UserResponse
)
from app.services.auth_service import (
    hash_password, verify_password, validate_password_strength,
    generate_otp, get_otp_expiry, verify_otp_not_expired,
    generate_session_token, get_session_expiry,
    verify_session_token, invalidate_session,
    create_oauth_session_token,
    get_current_user, check_rate_limit,
    MAX_OTP_ATTEMPTS
)
from app.services.email_service import send_otp_email
from datetime import datetime, timezone
import logging

# Import OAuth clients (lazy-loaded)
from app.services.oauth_service import get_oauth_clients
import random
import json

router = APIRouter()
logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════
# REGISTER
# ═══════════════════════════════════════════════

@router.post("/register")
async def register(
    request: Request,
    user: UserRegister,
    db: Connection = Depends(get_db)
):
    """Register a new user with email and password. Sends OTP to email."""
    # Rate limit: 3 registrations per IP per minute
    check_rate_limit(request, "register", max_requests=3)

    if len(user.username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters")

    # Validate password strength
    valid, msg = validate_password_strength(user.password)
    if not valid:
        raise HTTPException(status_code=400, detail=msg)

    try:
        hashed = hash_password(user.password)
        otp = generate_otp()
        otp_expiry = get_otp_expiry()
        cursor = db.cursor()
        cursor.execute(
            """INSERT INTO users (username, email, password_hash, verification_otp, otp_expiry, is_verified)
               VALUES (?, ?, ?, ?, ?, 0)""",
            (user.username, user.email, hashed, otp, otp_expiry)
        )
        db.commit()
        user_id = cursor.lastrowid
        logger.info(f"User registered: ID={user_id}, email={user.email}")
    except IntegrityError as e:
        if "email" in str(e):
            raise HTTPException(status_code=400, detail="Email already registered")
        raise HTTPException(status_code=400, detail="Username already taken")

    # Send OTP via email
    try:
        await send_otp_email(user.email, otp, purpose="verification")
    except Exception as e:
        logger.error(f"Failed to send verification email: {e}")
        raise HTTPException(
            status_code=500,
            detail="Registration successful but failed to send verification email. Please check your SMTP settings."
        )

    return {
        "message": "Registration successful! Please check your email for the verification code.",
        "email": user.email
    }


# ═══════════════════════════════════════════════
# LOGIN (password-based)
# ═══════════════════════════════════════════════

@router.post("/login", response_model=AuthResponse)
async def login(
    request: Request,
    credentials: UserLogin,
    db: Connection = Depends(get_db)
):
    """Authenticate user with email and password."""
    # Rate limit: 5 login attempts per IP per minute
    check_rate_limit(request, "login", max_requests=5)

    cursor = db.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (credentials.email,))
    user = cursor.fetchone()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Check password
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Check if email is verified
    if not user["is_verified"]:
        # Generate new OTP and resend
        otp = generate_otp()
        otp_expiry = get_otp_expiry()
        cursor.execute(
            "UPDATE users SET verification_otp = ?, otp_expiry = ?, otp_attempts = 0 WHERE id = ?",
            (otp, otp_expiry, user["id"])
        )
        db.commit()
        try:
            await send_otp_email(user["email"], otp, purpose="verification")
        except Exception:
            pass
        raise HTTPException(
            status_code=403,
            detail="Email not verified. A new verification code has been sent to your email."
        )

    # Create session
    session_token = generate_session_token()
    session_expiry = get_session_expiry()
    cursor.execute(
        "UPDATE users SET session_token = ?, session_expiry = ? WHERE id = ?",
        (session_token, session_expiry, user["id"])
    )
    db.commit()

    user_dict = dict(cursor.execute(
        "SELECT id, username, email, is_verified, avatar_url, google_id, github_id FROM users WHERE id = ?",
        (user["id"],)
    ).fetchone())

    return AuthResponse(session_token=session_token, user=UserResponse(**user_dict))


# ═══════════════════════════════════════════════
# VERIFY OTP (after registration)
# ═══════════════════════════════════════════════

@router.post("/verify-otp", response_model=AuthResponse)
async def verify_otp(
    request: Request,
    data: OTPVerify,
    db: Connection = Depends(get_db)
):
    """Verify OTP sent during registration."""
    check_rate_limit(request, "verify_otp", max_requests=5)

    cursor = db.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (data.email,))
    user = cursor.fetchone()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user["is_verified"]:
        raise HTTPException(status_code=400, detail="Email already verified")

    # Check OTP attempts
    if user["otp_attempts"] >= MAX_OTP_ATTEMPTS:
        raise HTTPException(
            status_code=429,
            detail="Too many incorrect attempts. Please request a new OTP."
        )

    # Verify OTP
    if user["verification_otp"] != data.otp:
        cursor.execute(
            "UPDATE users SET otp_attempts = otp_attempts + 1 WHERE id = ?",
            (user["id"],)
        )
        db.commit()
        remaining = MAX_OTP_ATTEMPTS - (user["otp_attempts"] + 1)
        raise HTTPException(
            status_code=400,
            detail=f"Invalid OTP. {max(0, remaining)} attempt(s) remaining."
        )

    # Check expiry
    if not verify_otp_not_expired(user["otp_expiry"]):
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")

    # Verify user and create session
    session_token = generate_session_token()
    session_expiry = get_session_expiry()
    cursor.execute(
        """UPDATE users SET is_verified = 1, verification_otp = NULL, otp_expiry = NULL,
           otp_attempts = 0, session_token = ?, session_expiry = ? WHERE id = ?""",
        (session_token, session_expiry, user["id"])
    )
    db.commit()

    user_dict = dict(cursor.execute(
        "SELECT id, username, email, is_verified, avatar_url, google_id, github_id FROM users WHERE id = ?",
        (user["id"],)
    ).fetchone())

    return AuthResponse(session_token=session_token, user=UserResponse(**user_dict))


# ═══════════════════════════════════════════════
# RESEND OTP
# ═══════════════════════════════════════════════

@router.post("/resend-otp")
async def resend_otp(
    request: Request,
    data: OTPResend,
    db: Connection = Depends(get_db)
):
    """Resend a new verification OTP to the user's email."""
    check_rate_limit(request, "resend_otp", max_requests=2, window=120)  # 2 per 2 minutes

    cursor = db.cursor()
    cursor.execute("SELECT id, is_verified FROM users WHERE email = ?", (data.email,))
    user = cursor.fetchone()

    if not user:
        raise HTTPException(status_code=404, detail="Email not found. Please register first.")

    if user["is_verified"]:
        raise HTTPException(status_code=400, detail="Email already verified. Please log in.")

    otp = generate_otp()
    otp_expiry = get_otp_expiry()
    cursor.execute(
        "UPDATE users SET verification_otp = ?, otp_expiry = ?, otp_attempts = 0 WHERE email = ?",
        (otp, otp_expiry, data.email)
    )
    db.commit()

    try:
        await send_otp_email(data.email, otp, purpose="verification")
    except Exception as e:
        logger.error(f"Failed to resend OTP: {e}")
        raise HTTPException(status_code=500, detail="Failed to send OTP. Please try again later.")

    return {"message": "A new OTP has been sent to your email.", "email": data.email}


# ═══════════════════════════════════════════════
# FORGOT PASSWORD - Request OTP
# ═══════════════════════════════════════════════

@router.post("/forgot-password")
async def forgot_password(
    request: Request,
    data: ForgotPasswordRequest,
    db: Connection = Depends(get_db)
):
    """Send a password reset OTP to the user's email."""
    check_rate_limit(request, "forgot_password", max_requests=2, window=120)

    cursor = db.cursor()
    cursor.execute("SELECT id, username FROM users WHERE email = ?", (data.email,))
    user = cursor.fetchone()

    if not user:
        # Don't reveal if email exists - return generic message
        return {"message": "If this email is registered, you will receive a password reset code.", "email": data.email}

    otp = generate_otp()
    otp_expiry = get_otp_expiry()
    cursor.execute(
        "UPDATE users SET forgot_password_otp = ?, forgot_otp_expiry = ?, forgot_otp_attempts = 0 WHERE id = ?",
        (otp, otp_expiry, user["id"])
    )
    db.commit()

    try:
        await send_otp_email(data.email, otp, purpose="forgot_password")
    except Exception as e:
        logger.error(f"Failed to send forgot password email: {e}")
        raise HTTPException(status_code=500, detail="Failed to send reset code. Please try again later.")

    return {"message": "If this email is registered, you will receive a password reset code.", "email": data.email}


# ═══════════════════════════════════════════════
# VERIFY FORGOT PASSWORD OTP
# ═══════════════════════════════════════════════

@router.post("/verify-forgot-otp")
async def verify_forgot_otp(
    request: Request,
    data: ForgotPasswordVerify,
    db: Connection = Depends(get_db)
):
    """Verify the forgot password OTP."""
    check_rate_limit(request, "verify_forgot", max_requests=5)

    cursor = db.cursor()
    cursor.execute(
        "SELECT id, forgot_password_otp, forgot_otp_expiry, forgot_otp_attempts FROM users WHERE email = ?",
        (data.email,)
    )
    user = cursor.fetchone()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user["forgot_password_otp"]:
        raise HTTPException(status_code=400, detail="No password reset requested. Please request a reset first.")

    # Check attempts
    if user["forgot_otp_attempts"] >= MAX_OTP_ATTEMPTS:
        cursor.execute(
            "UPDATE users SET forgot_password_otp = NULL, forgot_otp_expiry = NULL, forgot_otp_attempts = 0, forgot_otp_verified = 0 WHERE id = ?",
            (user["id"],)
        )
        db.commit()
        raise HTTPException(
            status_code=429,
            detail="Too many incorrect attempts. Please request a new reset code."
        )

    # Verify OTP
    if user["forgot_password_otp"] != data.otp:
        cursor.execute(
            "UPDATE users SET forgot_otp_attempts = forgot_otp_attempts + 1 WHERE id = ?",
            (user["id"],)
        )
        db.commit()
        remaining = MAX_OTP_ATTEMPTS - (user["forgot_otp_attempts"] + 1)
        raise HTTPException(
            status_code=400,
            detail=f"Invalid reset code. {max(0, remaining)} attempt(s) remaining."
        )

    # Check expiry
    if not verify_otp_not_expired(user["forgot_otp_expiry"]):
        raise HTTPException(status_code=400, detail="Reset code has expired. Please request a new one.")

    # Mark OTP as verified for the subsequent reset-password call
    cursor.execute(
        "UPDATE users SET forgot_otp_verified = 1 WHERE id = ?",
        (user["id"],)
    )
    db.commit()

    return {"message": "Code verified successfully. You can now reset your password.", "email": data.email}


# ═══════════════════════════════════════════════
# RESET PASSWORD
# ═══════════════════════════════════════════════

@router.post("/reset-password")
async def reset_password(
    request: Request,
    data: ResetPassword,
    db: Connection = Depends(get_db)
):
    """Reset the password after OTP verification."""
    check_rate_limit(request, "reset_password", max_requests=3)

    # Validate new password
    valid, msg = validate_password_strength(data.new_password)
    if not valid:
        raise HTTPException(status_code=400, detail=msg)

    cursor = db.cursor()
    cursor.execute(
        "SELECT id, forgot_password_otp, forgot_otp_expiry, forgot_otp_verified FROM users WHERE email = ?",
        (data.email,)
    )
    user = cursor.fetchone()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user["forgot_password_otp"]:
        raise HTTPException(status_code=400, detail="No password reset requested. Please request a reset first.")

    if not user["forgot_otp_verified"]:
        raise HTTPException(status_code=400, detail="Reset code not verified. Please verify the OTP first.")

    # Verify OTP one more time
    if user["forgot_password_otp"] != data.otp:
        raise HTTPException(status_code=400, detail="Invalid reset code")

    if not verify_otp_not_expired(user["forgot_otp_expiry"]):
        raise HTTPException(status_code=400, detail="Reset code has expired. Please request a new one.")

    # Hash new password and update
    new_hashed = hash_password(data.new_password)
    cursor.execute(
        """UPDATE users SET password_hash = ?, forgot_password_otp = NULL, forgot_otp_expiry = NULL,
           forgot_otp_attempts = 0, forgot_otp_verified = 0, session_token = NULL, session_expiry = NULL WHERE id = ?""",
        (new_hashed, user["id"])
    )
    db.commit()

    logger.info(f"Password reset successful for user ID={user['id']}")

    return {"message": "Password has been reset successfully. Please log in with your new password."}


# ═══════════════════════════════════════════════
# LOGOUT
# ═══════════════════════════════════════════════

@router.post("/logout")
async def logout(
    current_user: UserResponse = Depends(get_current_user),
    db: Connection = Depends(get_db)
):
    """Logout by invalidating the current session."""
    invalidate_session(db, current_user.id)
    return {"message": "Logged out successfully"}


# ═══════════════════════════════════════════════
# GET CURRENT USER
# ═══════════════════════════════════════════════

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: UserResponse = Depends(get_current_user)):
    """Get the currently authenticated user's profile."""
    return current_user


# ═══════════════════════════════════════════════
# SOCIAL LOGIN - Google & GitHub
# ═══════════════════════════════════════════════

@router.get("/oauth/{provider}")
async def oauth_login(provider: str, request: Request):
    """Initiate OAuth login with Google or GitHub."""
    if provider not in ("google", "github"):
        raise HTTPException(status_code=400, detail="Invalid OAuth provider. Supported: google, github")

    oauth = get_oauth_clients()
    client = oauth.create_client(provider)
    if not client:
        raise HTTPException(
            status_code=400,
            detail=f"{provider.capitalize()} OAuth is not configured. Check your .env file for {provider.upper()}_CLIENT_ID and {provider.upper()}_CLIENT_SECRET."
        )

    redirect_uri = str(request.url_for("oauth_callback", provider=provider))
    return await client.authorize_redirect(request, redirect_uri)


@router.get("/callback/{provider}", name="oauth_callback")
async def oauth_callback(provider: str, request: Request, db: Connection = Depends(get_db)):
    """Handle OAuth callback from Google or GitHub."""
    if provider not in ("google", "github"):
        raise HTTPException(status_code=400, detail="Invalid OAuth provider")

    oauth = get_oauth_clients()
    client = oauth.create_client(provider)
    if not client:
        raise HTTPException(status_code=400, detail=f"{provider.capitalize()} OAuth not configured")

    try:
        token = await client.authorize_access_token(request)
    except Exception as e:
        logger.error(f"OAuth token error: {e}")
        raise HTTPException(status_code=400, detail="Failed to authenticate with provider")

    # Extract user info
    email = None
    name = None
    avatar = None
    provider_id = None

    if provider == "google":
        userinfo = token.get("userinfo")
        if userinfo:
            email = userinfo.get("email")
            name = userinfo.get("name") or userinfo.get("given_name", "User")
            avatar = userinfo.get("picture")
            provider_id = userinfo.get("sub")
    elif provider == "github":
        try:
            resp = await client.get("user", token=token)
            userinfo = resp.json()
            name = userinfo.get("name") or userinfo.get("login")
            avatar = userinfo.get("avatar_url")
            provider_id = str(userinfo.get("id"))
            # GitHub might not return email
            email = userinfo.get("email")
            if not email:
                email_resp = await client.get("user/emails", token=token)
                emails = email_resp.json()
                primary = [e for e in emails if e.get("primary") and e.get("verified")]
                email = primary[0]["email"] if primary else (emails[0]["email"] if emails else None)
        except Exception as e:
            logger.error(f"GitHub userinfo error: {e}")
            raise HTTPException(status_code=400, detail="Failed to get user info from GitHub")

    if not email:
        raise HTTPException(status_code=400, detail=f"Could not retrieve email from {provider}")

    cursor = db.cursor()

    # Check if user exists by email
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    existing_user = cursor.fetchone()

    if existing_user:
        # Link OAuth account if not already linked
        if provider == "google" and not existing_user["google_id"]:
            cursor.execute("UPDATE users SET google_id = ?, avatar_url = ? WHERE id = ?",
                          (provider_id, avatar, existing_user["id"]))
        elif provider == "github" and not existing_user["github_id"]:
            cursor.execute("UPDATE users SET github_id = ?, avatar_url = ? WHERE id = ?",
                          (provider_id, avatar, existing_user["id"]))

        # Update avatar if not set
        if not existing_user["avatar_url"] and avatar:
            cursor.execute("UPDATE users SET avatar_url = ? WHERE id = ?", (avatar, existing_user["id"]))

        db.commit()
        user_id = existing_user["id"]
        username = existing_user["username"]
    else:
        # Create new user
        username = name or email.split("@")[0]
        # Make username unique by appending random suffix if needed
        cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
        if cursor.fetchone():
            username = f"{username}_{random_suffix()}"

        id_field = "google_id" if provider == "google" else "github_id"
        cursor.execute(
            f"INSERT INTO users (username, email, {id_field}, avatar_url, is_verified) VALUES (?, ?, ?, ?, 1)",
            (username, email, provider_id, avatar)
        )
        db.commit()
        user_id = cursor.lastrowid

    # Create session token
    session_token = create_oauth_session_token(db, user_id)

    # Get user data for response
    cursor.execute(
        "SELECT id, username, email, is_verified, avatar_url, google_id, github_id FROM users WHERE id = ?",
        (user_id,)
    )
    user_dict = dict(cursor.fetchone())

    # Return HTML page that posts the session token back to the opener window
    return f"""
    <html>
    <head><title>Login Successful</title></head>
    <body style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#030712;font-family:sans-serif;color:white;">
      <div style="text-align:center;">
        <div style="font-size:48px;margin-bottom:16px;">✅</div>
        <h2>Login Successful!</h2>
        <p style="color:#94a3b8;">You can close this window.</p>
      </div>
      <script>
        const data = {{
          session_token: "{session_token}",
          user: {json.dumps(user_dict)}
        }};
        if (window.opener) {{
          window.opener.postMessage(data, "*");
          window.close();
        }} else {{
          window.location.href = "/oauth/success?session_token={session_token}";
        }}
      </script>
    </body>
    </html>
    """


@router.get("/oauth/success")
async def oauth_success(session_token: str = ""):
    """Fallback page for OAuth success when popup is blocked."""
    return {"message": "Login successful", "session_token": session_token}


def random_suffix(length: int = 6) -> str:
    """Generate a random alphanumeric suffix."""
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))
