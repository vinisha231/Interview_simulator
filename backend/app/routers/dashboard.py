from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.session import InterviewSession
from typing import Dict
from app.routers.auth import get_current_active_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user)
) -> Dict:
    sessions = (
        db.query(InterviewSession)
        .filter(InterviewSession.user_id == current_user.id)
        .all()
    )

    if not sessions:
        return {
            "message": "No sessions found",
            "total_sessions": 0,
            "total_interviews": 0,
            "total_score": 0,
            "total_behavioral_score": 0,
            "total_technical_score": 0,
            "best_score": 0,
            "last_interview_at": None,
            "last_role": None,
            "last_company": None,
            "average_score": 0,
            "technical_average": 0,
            "behavioral_average": 0,
            "average_by_type": {},
            "total_by_type": {},
            "strengths": [],
            "weaknesses": []
        }

    total_sessions = len(sessions)
    total_score = sum(s.score or 0 for s in sessions)
    avg_score = total_score / total_sessions
    types = {}
    totals_by_type = {}
    for s in sessions:
        types.setdefault(s.interview_type, []).append(s.score or 0)
        totals_by_type[s.interview_type] = totals_by_type.get(s.interview_type, 0) + (s.score or 0)

    avg_by_type = {t: sum(scores)/len(scores) for t, scores in types.items() if scores}
    strengths = [s.feedback for s in sessions if (s.score or 0) >= 80]
    weaknesses = [s.feedback for s in sessions if (s.score or 0) < 60]
    best_score = max((s.score or 0) for s in sessions)
    last_session = max(sessions, key=lambda s: s.created_at or 0)

    return {
        "total_sessions": total_sessions,
        "total_interviews": total_sessions,
        "total_score": total_score,
        "total_behavioral_score": totals_by_type.get("behavioral", 0),
        "total_technical_score": totals_by_type.get("technical", 0),
        "best_score": best_score,
        "last_interview_at": last_session.created_at,
        "last_role": last_session.role,
        "last_company": last_session.company,
        "average_score": round(avg_score, 2),
        "technical_average": round(avg_by_type.get("technical", 0), 2),
        "behavioral_average": round(avg_by_type.get("behavioral", 0), 2),
        "average_by_type": avg_by_type,
        "total_by_type": totals_by_type,
        "strengths": strengths,
        "weaknesses": weaknesses
    }


# ✅ FIXED: now this route is separate, not inside the function above
@router.get("/history")
def get_history(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user)
):
    """Return chronological interview history with scores and feedback."""
    sessions = (
        db.query(InterviewSession)
        .filter(InterviewSession.user_id == current_user.id)
        .order_by(InterviewSession.created_at.desc())
        .limit(20)
        .all()
    )

    return [
        {
            "id": s.id,
            "type": s.interview_type,
            "role": s.role,
            "company": s.company,
            "difficulty": s.difficulty,
            "question": s.question,
            "user_answer": s.user_answer,
            "score": s.score,
            "feedback": s.feedback,
            "notes": s.notes,
            "created_at": s.created_at
        }
        for s in sessions
    ]