from fastapi import APIRouter, HTTPException, Depends
from sqlite3 import Connection
from app.database.db import get_db

router = APIRouter()


@router.get("/session/{session_id}")
def get_session_report(session_id: int, db: Connection = Depends(get_db)):
    cursor = db.cursor()

    cursor.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
    session = cursor.fetchone()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    cursor.execute("""
        SELECT * FROM interview_responses 
        WHERE session_id = ? 
        ORDER BY created_at ASC
    """, (session_id,))
    responses = cursor.fetchall()

    if not responses:
        return {
            "session_id": session_id,
            "domain": session["domain"],
            "difficulty": session["difficulty"],
            "responses": [],
            "average_technical": 0,
            "average_communication": 0,
            "average_confidence": 0,
            "average_overall": 0,
            "created_at": session["created_at"]
        }

    responses_list = [dict(r) for r in responses]
    n = len(responses_list)

    avg_technical = round(sum(r["technical_score"] for r in responses_list) / n, 1)
    avg_communication = round(sum(r["communication_score"] for r in responses_list) / n, 1)
    avg_confidence = round(sum(r["confidence_score"] for r in responses_list) / n, 1)
    avg_overall = round(sum(r["overall_score"] for r in responses_list) / n, 1)
    total_fillers = sum(r["filler_words"] for r in responses_list)
    avg_wpm = round(sum(r["words_per_minute"] for r in responses_list) / n, 1)

    return {
        "session_id": session_id,
        "domain": session["domain"],
        "difficulty": session["difficulty"],
        "responses": responses_list,
        "average_technical": avg_technical,
        "average_communication": avg_communication,
        "average_confidence": avg_confidence,
        "average_overall": avg_overall,
        "total_filler_words": total_fillers,
        "average_wpm": avg_wpm,
        "questions_answered": n,
        "suspicion_score": session["suspicion_score"],
        "fraud_log": session["fraud_log"],
        "created_at": session["created_at"]
    }


@router.get("/user/{user_id}/stats")
def get_user_stats(user_id: int, db: Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("""
        SELECT 
            COUNT(DISTINCT s.id) as total_sessions,
            COUNT(ir.id) as total_questions,
            AVG(ir.overall_score) as avg_overall,
            AVG(ir.technical_score) as avg_technical,
            AVG(ir.communication_score) as avg_communication,
            AVG(ir.confidence_score) as avg_confidence,
            MAX(ir.overall_score) as best_score
        FROM sessions s
        LEFT JOIN interview_responses ir ON s.id = ir.session_id
        WHERE s.user_id = ?
    """, (user_id,))
    stats = cursor.fetchone()
    return dict(stats) if stats else {}
