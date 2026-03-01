from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.session import InterviewSession
from typing import Dict
from app.routers.auth import get_current_active_user

# Sentinel for sorting when created_at may be None (avoid mixing types in sort key)
_MIN_DT = datetime.min.replace(tzinfo=timezone.utc)

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
            "most_recent_technical_score": None,
            "technical_average": 0,
            "most_recent_behavioral_score": None,
            "behavioral_average": 0,
            "most_recent_design_score": None,
            "design_average": 0,
            "last_interview_at": None,
            "last_role": None,
            "last_company": None,
            "average_score": 0,
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

    avg_by_type = {t: sum(scores) / len(scores) for t, scores in types.items() if scores}
    # Strengths: highlight + full feedback per session (when we have a strength or high score)
    strengths = []
    for s in sessions:
        sh = getattr(s, "strength_highlight", None)
        if sh and str(sh).strip():
            strengths.append({"highlight": str(sh).strip(), "feedback": s.feedback or ""})
        elif (s.score or 0) >= 80 and s.feedback:
            strengths.append({"highlight": s.feedback[:100] + ("..." if len(s.feedback or "") > 100 else ""), "feedback": s.feedback or ""})
    # Areas for improvement: include full feedback for lower-scoring sessions
    weaknesses = [{"feedback": s.feedback or ""} for s in sessions if (s.score or 0) < 60 and s.feedback]
    last_session = max(sessions, key=lambda s: s.created_at or _MIN_DT)

    # Most recent score per type (latest session of that type by created_at)
    tech_sessions = sorted([s for s in sessions if s.interview_type == "technical"], key=lambda s: s.created_at or _MIN_DT, reverse=True)
    beh_sessions = sorted([s for s in sessions if s.interview_type == "behavioral"], key=lambda s: s.created_at or _MIN_DT, reverse=True)
    design_sessions = sorted([s for s in sessions if s.interview_type == "design"], key=lambda s: s.created_at or _MIN_DT, reverse=True)
    most_recent_technical_score = tech_sessions[0].score if tech_sessions else None
    most_recent_behavioral_score = beh_sessions[0].score if beh_sessions else None
    most_recent_design_score = design_sessions[0].score if design_sessions else None

    return {
        "total_sessions": total_sessions,
        "total_interviews": total_sessions,
        "most_recent_technical_score": most_recent_technical_score,
        "technical_average": round(avg_by_type.get("technical", 0), 2),
        "most_recent_behavioral_score": most_recent_behavioral_score,
        "behavioral_average": round(avg_by_type.get("behavioral", 0), 2),
        "most_recent_design_score": most_recent_design_score,
        "design_average": round(avg_by_type.get("design", 0), 2),
        "last_interview_at": last_session.created_at,
        "last_role": last_session.role,
        "last_company": last_session.company,
        "average_score": round(avg_score, 2),
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
            "created_at": s.created_at,
            "time_spent_seconds": getattr(s, "time_spent_seconds", None),
            "session_total_seconds": getattr(s, "session_total_seconds", None),
        }
        for s in sessions
    ]