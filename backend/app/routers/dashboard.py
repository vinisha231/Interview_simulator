from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.session import InterviewSession
from typing import Dict

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)) -> Dict:
    sessions = db.query(InterviewSession).all()

    if not sessions:
        return {
            "message": "No sessions found",
            "total_sessions": 0,
            "total_interviews": 0,
            "average_score": 0,
            "technical_average": 0,
            "behavioral_average": 0,
            "average_by_type": {},
            "strengths": [],
            "weaknesses": []
        }

    total_sessions = len(sessions)
    avg_score = sum(s.score or 0 for s in sessions) / total_sessions
    types = {}
    for s in sessions:
        types.setdefault(s.interview_type, []).append(s.score or 0)

    avg_by_type = {t: sum(scores)/len(scores) for t, scores in types.items() if scores}
    strengths = [s.feedback for s in sessions if (s.score or 0) >= 80]
    weaknesses = [s.feedback for s in sessions if (s.score or 0) < 60]

    return {
        "total_sessions": total_sessions,
        "total_interviews": total_sessions,
        "average_score": round(avg_score, 2),
        "technical_average": round(avg_by_type.get("technical", 0), 2),
        "behavioral_average": round(avg_by_type.get("behavioral", 0), 2),
        "average_by_type": avg_by_type,
        "strengths": strengths,
        "weaknesses": weaknesses
    }


# ✅ FIXED: now this route is separate, not inside the function above
@router.get("/history")
def get_history(db: Session = Depends(get_db)):
    """Return chronological interview history with scores and feedback."""
    sessions = (
        db.query(InterviewSession)
        .order_by(InterviewSession.created_at.desc())
        .limit(20)
        .all()
    )

    return [
        {
            "id": s.id,
            "type": s.interview_type,
            "question": s.question,
            "user_answer": s.user_answer,
            "score": s.score,
            "feedback": s.feedback,
            "created_at": s.created_at
        }
        for s in sessions
    ]