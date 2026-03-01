from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.session import InterviewSession
from pydantic import BaseModel
from typing import List, Optional
from app.routers.auth import get_current_active_user

router = APIRouter(prefix="/api/sessions", tags=["sessions"])

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class SessionCreate(BaseModel):
    interview_type: str
    role: Optional[str] = None
    company: Optional[str] = None
    difficulty: Optional[str] = None
    question: str
    user_answer: Optional[str] = None
    feedback: Optional[str] = None
    score: Optional[int] = None
    strength_highlight: Optional[str] = None
    notes: Optional[str] = None
    time_spent_seconds: Optional[int] = None
    session_total_seconds: Optional[int] = None


@router.post("/")
def create_session(
    session_data: SessionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user)
):
    new_session = InterviewSession(
        user_id=current_user.id,
        role=session_data.role,
        company=session_data.company,
        interview_type=session_data.interview_type,
        difficulty=session_data.difficulty,
        question=session_data.question,
        user_answer=session_data.user_answer,
        feedback=session_data.feedback,
        score=session_data.score,
        strength_highlight=session_data.strength_highlight,
        notes=session_data.notes,
        time_spent_seconds=session_data.time_spent_seconds,
        session_total_seconds=session_data.session_total_seconds,
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return {"id": new_session.id, "message": "Session saved successfully"}


@router.get("/")
def list_sessions(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user)
):
    """List sessions for the current user only."""
    sessions = (
        db.query(InterviewSession)
        .filter(InterviewSession.user_id == current_user.id)
        .order_by(InterviewSession.created_at.desc())
        .all()
    )
    return sessions