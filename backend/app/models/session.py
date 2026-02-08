from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    role = Column(String(120), nullable=True)
    company = Column(String(120), nullable=True)
    interview_type = Column(String(50))
    difficulty = Column(String(20), nullable=True)
    question = Column(Text)
    user_answer = Column(Text)
    feedback = Column(Text)
    score = Column(Integer)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())