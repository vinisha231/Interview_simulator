from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.session import InterviewSession
from pydantic import BaseModel
from typing import List, Optional

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
    question: str
    user_answer: Optional[str] = None
    feedback: Optional[str] = None
    score: Optional[int] = None


@router.post("/")
def create_session(session_data: SessionCreate, db: Session = Depends(get_db)):
    new_session = InterviewSession(
        interview_type=session_data.interview_type,
        question=session_data.question,
        user_answer=session_data.user_answer,
        feedback=session_data.feedback,
        score=session_data.score
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return {"id": new_session.id, "message": "Session saved successfully"}


@router.get("/", response_model=List[SessionCreate])
def list_sessions(db: Session = Depends(get_db)):
    sessions = db.query(InterviewSession).order_by(InterviewSession.created_at.desc()).all()
    return sessions