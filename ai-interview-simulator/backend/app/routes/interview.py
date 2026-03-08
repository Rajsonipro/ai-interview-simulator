from fastapi import APIRouter, HTTPException, Depends, File, UploadFile
from sqlite3 import Connection
import io
import PyPDF2
from app.database.db import get_db
from app.models.schemas import SessionCreate, AnswerSubmit, QuestionsResponse
from app.services.ai_service import generate_questions, evaluate_answer

router = APIRouter()


@router.post("/session", response_model=dict)
async def create_session(session: SessionCreate, db: Connection = Depends(get_db)):
    valid_domains = ["Software Developer", "HR", "Marketing"]
    valid_difficulties = ["Beginner", "Intermediate", "Advanced"]

    if session.domain not in valid_domains:
        raise HTTPException(status_code=400, detail=f"Invalid domain. Choose from: {valid_domains}")
    if session.difficulty not in valid_difficulties:
        raise HTTPException(status_code=400, detail=f"Invalid difficulty. Choose from: {valid_difficulties}")

    cursor = db.cursor()
    cursor.execute(
        "INSERT INTO sessions (user_id, domain, difficulty, resume_text) VALUES (?, ?, ?, ?)",
        (session.user_id, session.domain, session.difficulty, session.resume_text)
    )
    db.commit()
    session_id = cursor.lastrowid
    print(f"DEBUG: New session created: {session_id} for user {session.user_id}")

    questions = await generate_questions(session.domain, session.difficulty, session.resume_text, session_id=session_id)

    return {
        "session_id": session_id,
        "domain": session.domain,
        "difficulty": session.difficulty,
        "questions": questions
    }


@router.post("/evaluate", response_model=dict)
async def evaluate_response(submission: AnswerSubmit, db: Connection = Depends(get_db)):
    if not submission.answer or len(submission.answer.strip()) < 5:
        raise HTTPException(status_code=400, detail="Answer is too short to evaluate")

    cursor = db.cursor()
    cursor.execute("SELECT * FROM sessions WHERE id = ?", (submission.session_id,))
    session = cursor.fetchone()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    evaluation = await evaluate_answer(
        question=submission.question,
        answer=submission.answer,
        domain=session["domain"],
        difficulty=session["difficulty"],
        duration_seconds=submission.duration_seconds or 0
    )

    # Save response
    cursor.execute("""
        INSERT INTO interview_responses 
        (session_id, user_id, question, answer, technical_score, communication_score, 
         confidence_score, overall_score, feedback, filler_words, words_per_minute)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        submission.session_id,
        submission.user_id,
        submission.question,
        submission.answer,
        evaluation["technical_score"],
        evaluation["communication_score"],
        evaluation["confidence_score"],
        evaluation["overall_score"],
        evaluation["feedback"],
        evaluation["filler_words"],
        evaluation["words_per_minute"]
    ))

    # Update session fraud info (accumulative)
    if submission.suspicion_score or submission.fraud_log:
        cursor.execute("""
            UPDATE sessions 
            SET suspicion_score = suspicion_score + ?,
                fraud_log = COALESCE(fraud_log, '') || ?
            WHERE id = ?
        """, (submission.suspicion_score or 0, submission.fraud_log or "", submission.session_id))
    
    db.commit()
    response_id = cursor.lastrowid

    return {
        "response_id": response_id,
        **evaluation
    }


@router.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    if not file.filename.endswith(('.pdf', '.txt')):
        raise HTTPException(status_code=400, detail="Only PDF and TXT files are supported")
    
    content = ""
    try:
        if file.filename.endswith('.pdf'):
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(await file.read()))
            for page in pdf_reader.pages:
                content += page.extract_text()
        else:
            content = (await file.read()).decode('utf-8')
            
        return {"content": content[:10000]} # Limit characters for AI
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error parsing file: {str(e)}")


@router.get("/history/{user_id}")
def get_user_history(user_id: int, db: Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("""
        SELECT s.id as session_id, s.domain, s.difficulty, s.created_at,
               COUNT(ir.id) as questions_answered,
               AVG(ir.overall_score) as avg_score
        FROM sessions s
        LEFT JOIN interview_responses ir ON s.id = ir.session_id
        WHERE s.user_id = ?
        GROUP BY s.id
        ORDER BY s.created_at DESC
        LIMIT 10
    """, (user_id,))
    sessions = cursor.fetchall()
    return {"history": [dict(s) for s in sessions]}
