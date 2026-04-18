from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List
import sqlite3
import hashlib
import jwt
import os
import json
import re
from datetime import datetime, timedelta
import httpx
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="AI Interview Simulator API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "interview-simulator-secret-2024")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

security = HTTPBearer()

# ─────────────────────────────────────────────
# Database Setup
# ─────────────────────────────────────────────

def get_db():
    conn = sqlite3.connect("interview_simulator.db")
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS interview_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            domain TEXT NOT NULL,
            difficulty TEXT NOT NULL,
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
            feedback TEXT DEFAULT '',
            filler_word_count INTEGER DEFAULT 0,
            words_per_minute REAL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES interview_sessions(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    conn.commit()
    conn.close()

init_db()

# ─────────────────────────────────────────────
# Pydantic Models
# ─────────────────────────────────────────────

class UserRegister(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class GenerateQuestionsRequest(BaseModel):
    domain: str
    difficulty: str

class EvaluateAnswerRequest(BaseModel):
    question: str
    answer: str
    domain: str
    difficulty: str
    duration_seconds: Optional[float] = 60

class SaveResponseRequest(BaseModel):
    session_id: int
    question: str
    answer: str
    technical_score: float
    communication_score: float
    confidence_score: float
    feedback: str
    filler_word_count: int
    words_per_minute: float

class CreateSessionRequest(BaseModel):
    domain: str
    difficulty: str

# ─────────────────────────────────────────────
# Auth Helpers
# ─────────────────────────────────────────────

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ─────────────────────────────────────────────
# Auth Routes
# ─────────────────────────────────────────────

@app.post("/auth/register")
async def register(user: UserRegister):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
            (user.username, user.email, hash_password(user.password))
        )
        conn.commit()
        user_id = cursor.lastrowid
        token = create_access_token({"user_id": user_id, "username": user.username})
        return {"token": token, "username": user.username, "user_id": user_id}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Username or email already exists")
    finally:
        conn.close()

@app.post("/auth/login")
async def login(user: UserLogin):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM users WHERE email = ? AND password_hash = ?",
        (user.email, hash_password(user.password))
    )
    db_user = cursor.fetchone()
    conn.close()
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"user_id": db_user["id"], "username": db_user["username"]})
    return {"token": token, "username": db_user["username"], "user_id": db_user["id"]}

# ─────────────────────────────────────────────
# Session Routes
# ─────────────────────────────────────────────

@app.post("/sessions/create")
async def create_session(req: CreateSessionRequest, user_id: int = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO interview_sessions (user_id, domain, difficulty) VALUES (?, ?, ?)",
        (user_id, req.domain, req.difficulty)
    )
    conn.commit()
    session_id = cursor.lastrowid
    conn.close()
    return {"session_id": session_id}

# ─────────────────────────────────────────────
# Question Generation
# ─────────────────────────────────────────────

FALLBACK_QUESTIONS = {
    "Software Developer": {
        "Beginner": [
            "What is the difference between a stack and a queue data structure?",
            "Explain the concept of object-oriented programming with an example.",
            "What is version control and why is Git important in software development?",
            "What is the difference between a compiled language and an interpreted language?",
            "Explain what an API is and give an example of how it's used."
        ],
        "Intermediate": [
            "Explain the SOLID principles and how you apply them in your code.",
            "What is the difference between REST and GraphQL APIs?",
            "How does a hash map work internally, and what are its time complexities?",
            "Describe common design patterns you've used and when to apply them.",
            "What is the difference between SQL and NoSQL databases? When would you use each?"
        ],
        "Advanced": [
            "How would you design a distributed caching system like Redis?",
            "Explain CAP theorem and how it affects distributed system design.",
            "How do you optimize a slow SQL query with millions of rows?",
            "Describe your approach to designing a microservices architecture.",
            "What are the trade-offs between monolithic and microservice architectures?"
        ]
    },
    "HR": {
        "Beginner": [
            "Tell me about yourself and your background.",
            "Why are you interested in this position?",
            "What are your greatest strengths and weaknesses?",
            "Describe a time you worked effectively in a team.",
            "Where do you see yourself in five years?"
        ],
        "Intermediate": [
            "Describe a conflict you had with a coworker and how you resolved it.",
            "Tell me about a time you had to meet a tight deadline. How did you manage it?",
            "How do you handle constructive criticism from a manager?",
            "Describe your leadership style with a concrete example.",
            "How do you prioritize tasks when you have multiple deadlines?"
        ],
        "Advanced": [
            "How would you handle a situation where you disagreed with your manager's decision?",
            "Tell me about a time you led a significant organizational change.",
            "How do you foster innovation and creativity in your team?",
            "Describe your approach to performance management and giving difficult feedback.",
            "How would you build and maintain a high-performing, diverse team?"
        ]
    },
    "Marketing": {
        "Beginner": [
            "What is the difference between digital marketing and traditional marketing?",
            "Explain the concept of a target audience and why it matters.",
            "What are the 4 Ps of marketing?",
            "What is SEO and why is it important for a business?",
            "What social media platforms would you use for a B2C brand and why?"
        ],
        "Intermediate": [
            "How would you measure the ROI of a marketing campaign?",
            "Describe a successful marketing campaign you've worked on or analyzed.",
            "How do you use data analytics to improve marketing decisions?",
            "Explain the customer journey and how marketing supports each stage.",
            "How would you develop a content marketing strategy for a SaaS product?"
        ],
        "Advanced": [
            "How would you build a go-to-market strategy for a new product launch?",
            "Describe how you would create and manage a $500K marketing budget.",
            "How do you align marketing strategy with overall business objectives?",
            "What is your approach to brand positioning in a competitive market?",
            "How would you use machine learning and AI in a modern marketing stack?"
        ]
    }
}

async def call_openai(prompt: str, system: str = "You are a helpful assistant.") -> str:
    if not OPENAI_API_KEY:
        return None
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"},
            json={
                "model": "gpt-3.5-turbo",
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": 1000,
                "temperature": 0.7
            }
        )
        if response.status_code == 200:
            return response.json()["choices"][0]["message"]["content"]
    return None

@app.post("/questions/generate")
async def generate_questions(req: GenerateQuestionsRequest, user_id: int = Depends(get_current_user)):
    ai_response = await call_openai(
        f"""Generate exactly 5 interview questions for a {req.domain} role at {req.difficulty} level.
Return ONLY a JSON array of 5 question strings. No explanations, no numbering, just the JSON array.
Example format: ["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"]""",
        "You are an expert interviewer. Return only valid JSON arrays."
    )
    if ai_response:
        try:
            cleaned = ai_response.strip()
            if cleaned.startswith("```"):
                cleaned = re.sub(r"```[a-z]*\n?", "", cleaned).strip("` \n")
            questions = json.loads(cleaned)
            if isinstance(questions, list) and len(questions) == 5:
                return {"questions": questions}
        except:
            pass
    domain_key = req.domain if req.domain in FALLBACK_QUESTIONS else "Software Developer"
    difficulty_key = req.difficulty if req.difficulty in FALLBACK_QUESTIONS[domain_key] else "Intermediate"
    return {"questions": FALLBACK_QUESTIONS[domain_key][difficulty_key]}

# ─────────────────────────────────────────────
# Answer Evaluation
# ─────────────────────────────────────────────

def detect_filler_words(text: str) -> dict:
    fillers = ["um", "uh", "like", "you know", "basically", "literally", "actually", "so", "well", "right"]
    text_lower = text.lower()
    count = 0
    found = []
    for filler in fillers:
        matches = re.findall(r'\b' + re.escape(filler) + r'\b', text_lower)
        if matches:
            count += len(matches)
            found.append({"word": filler, "count": len(matches)})
    return {"total": count, "details": found}

def calculate_wpm(text: str, duration_seconds: float) -> float:
    if duration_seconds <= 0:
        return 0
    words = len(text.split())
    return round((words / duration_seconds) * 60, 1)

def score_answer_locally(question: str, answer: str, domain: str) -> dict:
    """Fallback scoring when no API key is available"""
    word_count = len(answer.split())
    sentences = len(re.findall(r'[.!?]+', answer)) or 1
    avg_sentence_len = word_count / sentences

    # Technical score heuristic
    tech_keywords = {
        "Software Developer": ["algorithm", "complexity", "database", "api", "function", "class", "object", "array", "loop", "variable", "code", "system", "design", "pattern", "architecture"],
        "HR": ["team", "collaboration", "communication", "leadership", "conflict", "resolution", "management", "performance", "culture", "feedback", "goal"],
        "Marketing": ["campaign", "roi", "audience", "brand", "strategy", "conversion", "analytics", "digital", "content", "engagement", "market", "customer"]
    }
    keywords = tech_keywords.get(domain, tech_keywords["Software Developer"])
    answer_lower = answer.lower()
    keyword_hits = sum(1 for k in keywords if k in answer_lower)
    technical_score = min(100, 40 + (keyword_hits * 5) + min(20, word_count / 5))

    # Communication score
    has_structure = any(w in answer_lower for w in ["first", "second", "finally", "for example", "such as", "because", "therefore"])
    communication_score = min(100, 30 + (min(30, word_count / 4)) + (20 if has_structure else 0) + min(20, 20 - abs(avg_sentence_len - 15)))

    # Confidence score
    hedge_words = ["maybe", "perhaps", "i think", "i guess", "not sure", "might be"]
    confidence_words = ["i believe", "i know", "i have", "i am", "i will", "definitely", "certainly"]
    hedges = sum(1 for w in hedge_words if w in answer_lower)
    confidence = sum(1 for w in confidence_words if w in answer_lower)
    confidence_score = min(100, 50 + (confidence * 10) - (hedges * 8) + min(20, word_count / 6))

    feedback = f"Your answer contained {word_count} words. "
    if word_count < 50:
        feedback += "Consider providing more detailed responses. "
    if keyword_hits < 3:
        feedback += f"Try to incorporate more domain-specific terminology for {domain}. "
    if not has_structure:
        feedback += "Structuring your answer with clear points (first, second, finally) improves clarity. "
    feedback += "Practice speaking confidently and backing your statements with concrete examples."

    return {
        "technical_score": round(max(0, min(100, technical_score))),
        "communication_score": round(max(0, min(100, communication_score))),
        "confidence_score": round(max(0, min(100, confidence_score))),
        "feedback": feedback
    }

@app.post("/evaluate/answer")
async def evaluate_answer(req: EvaluateAnswerRequest, user_id: int = Depends(get_current_user)):
    filler_info = detect_filler_words(req.answer)
    wpm = calculate_wpm(req.answer, req.duration_seconds)

    ai_result = None
    ai_response = await call_openai(
        f"""You are an expert interview coach evaluating a candidate's answer.

Role: {req.domain}
Difficulty: {req.difficulty}
Question: {req.question}
Candidate's Answer: {req.answer}

Evaluate the answer and return ONLY a valid JSON object (no markdown, no explanation):
{{
  "technical_score": <0-100 integer>,
  "communication_score": <0-100 integer>,
  "confidence_score": <0-100 integer>,
  "feedback": "<2-3 sentences of specific, actionable feedback>"
}}

Scoring criteria:
- technical_score: Accuracy, depth, and relevance of technical content
- communication_score: Clarity, structure, and coherence of the response
- confidence_score: Assertiveness, use of strong language, avoid hedging""",
        "You are an expert HR interviewer and coach. Always return valid JSON only."
    )

    if ai_response:
        try:
            cleaned = ai_response.strip()
            if cleaned.startswith("```"):
                cleaned = re.sub(r"```[a-z]*\n?", "", cleaned).strip("` \n")
            ai_result = json.loads(cleaned)
        except:
            pass

    if not ai_result:
        ai_result = score_answer_locally(req.question, req.answer, req.domain)

    return {
        **ai_result,
        "filler_word_count": filler_info["total"],
        "filler_details": filler_info["details"],
        "words_per_minute": wpm,
        "word_count": len(req.answer.split())
    }

# ─────────────────────────────────────────────
# Save & Retrieve Responses
# ─────────────────────────────────────────────

@app.post("/responses/save")
async def save_response(req: SaveResponseRequest, user_id: int = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO interview_responses 
        (session_id, user_id, question, answer, technical_score, communication_score, 
         confidence_score, feedback, filler_word_count, words_per_minute)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (req.session_id, user_id, req.question, req.answer,
          req.technical_score, req.communication_score, req.confidence_score,
          req.feedback, req.filler_word_count, req.words_per_minute))
    conn.commit()
    response_id = cursor.lastrowid
    conn.close()
    return {"response_id": response_id, "message": "Response saved successfully"}

@app.get("/sessions/{session_id}/report")
async def get_session_report(session_id: int, user_id: int = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM interview_sessions WHERE id = ? AND user_id = ?", (session_id, user_id))
    session = cursor.fetchone()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    cursor.execute("SELECT * FROM interview_responses WHERE session_id = ? ORDER BY created_at", (session_id,))
    responses = [dict(r) for r in cursor.fetchall()]
    conn.close()
    if not responses:
        return {"session": dict(session), "responses": [], "summary": {}}

    avg_tech = sum(r["technical_score"] for r in responses) / len(responses)
    avg_comm = sum(r["communication_score"] for r in responses) / len(responses)
    avg_conf = sum(r["confidence_score"] for r in responses) / len(responses)
    overall = (avg_tech + avg_comm + avg_conf) / 3
    total_fillers = sum(r["filler_word_count"] for r in responses)
    avg_wpm = sum(r["words_per_minute"] for r in responses) / len(responses)

    return {
        "session": dict(session),
        "responses": responses,
        "summary": {
            "avg_technical": round(avg_tech, 1),
            "avg_communication": round(avg_comm, 1),
            "avg_confidence": round(avg_conf, 1),
            "overall_score": round(overall, 1),
            "total_filler_words": total_fillers,
            "avg_words_per_minute": round(avg_wpm, 1),
            "total_questions": len(responses)
        }
    }

@app.get("/history")
async def get_history(user_id: int = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT s.id, s.domain, s.difficulty, s.created_at,
               COUNT(r.id) as response_count,
               AVG((r.technical_score + r.communication_score + r.confidence_score) / 3) as avg_score
        FROM interview_sessions s
        LEFT JOIN interview_responses r ON s.id = r.session_id
        WHERE s.user_id = ?
        GROUP BY s.id
        ORDER BY s.created_at DESC
        LIMIT 10
    """, (user_id,))
    sessions = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return {"sessions": sessions}

@app.get("/health")
async def health():
    return {"status": "ok", "openai_configured": bool(OPENAI_API_KEY)}
