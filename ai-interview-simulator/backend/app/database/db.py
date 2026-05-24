import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "interview_simulator.db")

def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT,
            is_verified INTEGER DEFAULT 0,
            verification_otp TEXT,
            otp_expiry TIMESTAMP,
            otp_attempts INTEGER DEFAULT 0,
            session_token TEXT,
            session_expiry TIMESTAMP,
            forgot_password_otp TEXT,
            forgot_otp_expiry TIMESTAMP,
            forgot_otp_attempts INTEGER DEFAULT 0,
            forgot_otp_verified INTEGER DEFAULT 0,
            google_id TEXT UNIQUE,
            github_id TEXT UNIQUE,
            avatar_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Add missing columns if they don't exist (for migrations)
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN password_hash TEXT")
    except:
        pass
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN otp_attempts INTEGER DEFAULT 0")
    except:
        pass
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN forgot_password_otp TEXT")
    except:
        pass
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN forgot_otp_expiry TIMESTAMP")
    except:
        pass
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN forgot_otp_attempts INTEGER DEFAULT 0")
    except:
        pass
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN forgot_otp_verified INTEGER DEFAULT 0")
    except:
        pass
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN google_id TEXT UNIQUE")
    except:
        pass
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN github_id TEXT UNIQUE")
    except:
        pass

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            domain TEXT NOT NULL,
            difficulty TEXT NOT NULL,
            resume_text TEXT,
            suspicion_score INTEGER DEFAULT 0,
            fraud_log TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS interview_responses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            technical_score REAL DEFAULT 0,
            communication_score REAL DEFAULT 0,
            confidence_score REAL DEFAULT 0,
            overall_score REAL DEFAULT 0,
            feedback TEXT,
            filler_words INTEGER DEFAULT 0,
            words_per_minute REAL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES sessions(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    conn.commit()
    conn.close()
    print("Database initialized successfully.")
