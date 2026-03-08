from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class UserRegister(BaseModel):
    username: str
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class OTPVerify(BaseModel):
    email: str
    otp: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    is_verified: bool
    avatar_url: Optional[str] = None
    google_id: Optional[str] = None
    github_id: Optional[str] = None
    facebook_id: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class SessionCreate(BaseModel):
    user_id: int
    domain: str
    difficulty: str
    resume_text: Optional[str] = None


class SessionResponse(BaseModel):
    session_id: int
    domain: str
    difficulty: str


class QuestionsResponse(BaseModel):
    questions: List[str]
    session_id: int


class AnswerSubmit(BaseModel):
    session_id: int
    user_id: int
    question: str
    answer: str
    duration_seconds: Optional[float] = None
    suspicion_score: Optional[int] = 0
    fraud_log: Optional[str] = None


class EvaluationResult(BaseModel):
    technical_score: float
    communication_score: float
    confidence_score: float
    overall_score: float
    feedback: str
    filler_words: int
    filler_word_list: List[str]
    words_per_minute: float
    improvement_tips: List[str]


class ReportResponse(BaseModel):
    session_id: int
    domain: str
    difficulty: str
    responses: List[dict]
    average_technical: float
    average_communication: float
    average_confidence: float
    average_overall: float
    created_at: str
