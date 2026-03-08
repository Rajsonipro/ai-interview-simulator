from fastapi import APIRouter, HTTPException, Depends, Request
from sqlite3 import Connection, IntegrityError
from app.database.db import get_db
from app.models.schemas import UserRegister, UserLogin, TokenResponse, UserResponse, OTPVerify
from app.services.auth_service import (
    hash_password, verify_password, create_access_token, 
    generate_otp, get_otp_expiry
)
from app.services.oauth_service import oauth
from datetime import datetime, timezone
import os

router = APIRouter()

# Mock function for sending email. In production, use fastapi-mail or similar.
def send_verification_email(email: str, otp: str):
    print("\n" + "="*50)
    print(f"VERIFICATION CODE FOR: {email}")
    print(f"YOUR CODE IS: {otp}")
    print("="*50 + "\n")

@router.post("/register", response_model=dict)
def register(user: UserRegister, db: Connection = Depends(get_db)):
    print(f"\n--- NEW REGISTRATION ATTEMPT ---")
    print(f"Data: username={user.username}, email={user.email}")
    
    if len(user.password) < 6:
        print("Error: Password too short")
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    if len(user.username) < 3:
        print("Error: Username too short")
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters")

    try:
        otp = generate_otp()
        otp_expiry = get_otp_expiry()
        hashed = hash_password(user.password)
        print("Password hashed successfully")

        cursor = db.cursor()
        cursor.execute(
            """INSERT INTO users (username, email, password_hash, verification_otp, otp_expiry, is_verified) 
               VALUES (?, ?, ?, ?, ?, 0)""",
            (user.username, user.email, hashed, otp, otp_expiry)
        )
        db.commit()
        print(f"User saved to database. OTP: {otp}")
    except IntegrityError as e:
        print(f"Database Integrity Error: {str(e)}")
        if "email" in str(e):
            raise HTTPException(status_code=400, detail="Email already registered")
        raise HTTPException(status_code=400, detail="Username already taken")
    except Exception as e:
        print(f"REGISTRATION ERROR: {str(e)}")
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

    send_verification_email(user.email, otp)
    print("Verification email sent (log)")
    
    return {"message": "Registration successful. Please check your email for the verification code.", "email": user.email}

@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp(data: OTPVerify, db: Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (data.email,))
    user = cursor.fetchone()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user["is_verified"]:
        raise HTTPException(status_code=400, detail="User is already verified")

    # Handle string to datetime conversion if stored as TEXT in SQLite
    stored_expiry = user["otp_expiry"]
    if isinstance(stored_expiry, str):
        # Handle potential formats or assume ISO
        try:
            stored_expiry = datetime.fromisoformat(stored_expiry.replace('Z', '+00:00'))
        except:
             pass

    if user["verification_otp"] != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    # If otp_expiry is aware, compare directly. (Simplified for this mock)
    # if stored_expiry < datetime.now(timezone.utc):
    #    raise HTTPException(status_code=400, detail="OTP has expired")

    cursor.execute("UPDATE users SET is_verified = 1, verification_otp = NULL, otp_expiry = NULL WHERE id = ?", (user["id"],))
    db.commit()

    token = create_access_token({"sub": str(user["id"]), "email": user["email"]})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=user["id"], 
            username=user["username"], 
            email=user["email"], 
            is_verified=True,
            avatar_url=user["avatar_url"]
        )
    )

@router.post("/login", response_model=TokenResponse)
def login(credentials: UserLogin, db: Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (credentials.email,))
    user = cursor.fetchone()

    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user["is_verified"]:
        # Resend OTP logic could go here
        raise HTTPException(status_code=403, detail="Email not verified. Please verify your account.")

    token = create_access_token({"sub": str(user["id"]), "email": user["email"]})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=user["id"], 
            username=user["username"], 
            email=user["email"], 
            is_verified=bool(user["is_verified"]),
            avatar_url=user["avatar_url"]
        )
    )

# --- OAuth Routes ---

@router.get("/oauth/{provider}")
async def oauth_login(provider: str, request: Request):
    if provider not in ['google', 'github', 'facebook']:
        raise HTTPException(status_code=400, detail="Invalid OAuth provider")
    
    print(f"DEBUG: Attempting login for provider: {provider}")
    print(f"DEBUG: Registered clients: {list(oauth._clients.keys())}")
    
    client = oauth.create_client(provider)
    if not client:
        raise HTTPException(
            status_code=400, 
            detail=f"{provider.capitalize()} login is not configured (Registered: {list(oauth._clients.keys())}). Please add your Client ID and Secret to the .env file."
        )
    
    redirect_uri = request.url_for('auth_callback', provider=provider)
    # On many localhost setups, redirect_uri needs to be forced to http if using dev servers
    # redirect_uri = redirect_uri.replace('https', 'http') 
    
    return await oauth.create_client(provider).authorize_redirect(request, str(redirect_uri))

@router.get("/callback/{provider}", name="auth_callback")
async def auth_callback(provider: str, request: Request, db: Connection = Depends(get_db)):
    client = oauth.create_client(provider)
    if not client:
        raise HTTPException(status_code=400, detail="Invalid OAuth provider")
    
    token = await client.authorize_access_token(request)
    
    if provider == 'google':
        user_info = token.get('userinfo')
        email = user_info.get('email')
        name = user_info.get('name') or user_info.get('given_name', 'User')
        avatar = user_info.get('picture')
        pid_key = 'google_id'
        pid_val = user_info.get('sub')
    elif provider == 'github':
        resp = await client.get('user', token=token)
        user_info = resp.json()
        name = user_info.get('name') or user_info.get('login')
        avatar = user_info.get('avatar_url')
        pid_key = 'github_id'
        pid_val = str(user_info.get('id'))
        
        # GitHub might not return email in primary user fetch if private
        email = user_info.get('email')
        if not email:
            email_resp = await client.get('user/emails', token=token)
            emails = email_resp.json()
            # Find primary verified email
            email = next((e['email'] for e in emails if e['primary']), emails[0]['email'] if emails else None)
    elif provider == 'facebook':
        resp = await client.get('me?fields=id,name,email,picture', token=token)
        user_info = resp.json()
        email = user_info.get('email')
        name = user_info.get('name')
        avatar = user_info.get('picture', {}).get('data', {}).get('url')
        pid_key = 'facebook_id'
        pid_val = user_info.get('id')
    
    if not email:
        raise HTTPException(status_code=400, detail="Could not retrieve email from provider")

    cursor = db.cursor()
    # Check if user exists by email
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()

    if user:
        # Update social ID if missing
        if not user[pid_key]:
            cursor.execute(f"UPDATE users SET {pid_key} = ?, avatar_url = ? WHERE id = ?", (pid_val, avatar, user["id"]))
            db.commit()
    else:
        # Create new user
        cursor.execute(
            f"INSERT INTO users (username, email, {pid_key}, avatar_url, is_verified) VALUES (?, ?, ?, ?, 1)",
            (name, email, pid_val, avatar)
        )
        db.commit()
        cursor.execute("SELECT * FROM users WHERE id = ?", (cursor.lastrowid,))
        user = cursor.fetchone()

    # Create JWT
    jwt_token = create_access_token({"sub": str(user["id"]), "email": user["email"]})
    
    # In a real app, you might redirect to a frontend URL with the token
    # But for an API response, we'll return a HTML that tells the opener window the token
    return f"""
    <html>
        <script>
            window.opener.postMessage({{
                token: "{jwt_token}",
                user: {{"id": {user["id"]}, "username": "{user["username"]}", "email": "{user["email"]}", "avatar_url": "{user["avatar_url"]}"}}
            }}, "*");
            window.close();
        </script>
        <body>Login successful. Processing...</body>
    </html>
    """

@router.get("/me")
def get_me(request: Request, db: Connection = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
         raise HTTPException(status_code=401, detail="Unauthorized")
    
    token = auth_header.split(" ")[1]
    from app.services.auth_service import decode_token
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
        
    cursor = db.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (payload["sub"],))
    user = cursor.fetchone()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return UserResponse(
        id=user["id"], 
        username=user["username"], 
        email=user["email"], 
        is_verified=bool(user["is_verified"]),
        avatar_url=user["avatar_url"],
        google_id=user["google_id"],
        github_id=user["github_id"],
        facebook_id=user["facebook_id"]
    )
