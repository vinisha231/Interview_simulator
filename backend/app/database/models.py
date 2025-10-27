"""
Database Models - PostgreSQL Schema
===================================

SQLAlchemy models for the interview simulator database stored in RDS PostgreSQL.
This includes tables for users, sessions, answers, and feedback.

Author: LLM Interview Simulator Team
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Float, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

Base = declarative_base()


class User(Base):
    """User model - stores user information from AWS Cognito."""
    
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False)
    cognito_id = Column(String, unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    sessions = relationship("InterviewSession", back_populates="user")
    
    def __repr__(self):
        return f"<User(username={self.username}, email={self.email})>"


class InterviewSession(Base):
    """Interview session model - tracks each interview attempt."""
    
    __tablename__ = "interview_sessions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    interview_type = Column(String, nullable=False)  # technical, behavioral, etc.
    difficulty = Column(String, default="medium")  # easy, medium, hard
    status = Column(String, default="in_progress")  # in_progress, completed, abandoned
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    total_questions = Column(Integer, default=0)
    
    # Relationships
    user = relationship("User", back_populates="sessions")
    questions = relationship("InterviewQuestion", back_populates="session")
    
    def __repr__(self):
        return f"<InterviewSession(type={self.interview_type}, status={self.status})>"


class InterviewQuestion(Base):
    """Interview question model - stores questions and answers in a session."""
    
    __tablename__ = "interview_questions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("interview_sessions.id"), nullable=False)
    question_number = Column(Integer, nullable=False)
    question_text = Column(Text, nullable=False)
    user_answer = Column(Text, nullable=True)  # Can be null if not answered yet
    answer_transcript = Column(Text, nullable=True)  # For voice mode
    is_audio = Column(Boolean, default=False)  # True if answer was audio
    audio_url = Column(String, nullable=True)  # S3 URL if audio was recorded
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    session = relationship("InterviewSession", back_populates="questions")
    feedback = relationship("AnswerFeedback", back_populates="question", uselist=False)
    
    def __repr__(self):
        return f"<InterviewQuestion(question_number={self.question_number})>"


class AnswerFeedback(Base):
    """Feedback model - stores detailed evaluation of each answer."""
    
    __tablename__ = "answer_feedback"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    question_id = Column(String, ForeignKey("interview_questions.id"), nullable=False, unique=True)
    
    # Scores (1-5 scale)
    communication_score = Column(Float, nullable=False)
    technical_score = Column(Float, nullable=False)
    problem_solving_score = Column(Float, nullable=False)
    professional_tone_score = Column(Float, nullable=False)
    overall_score = Column(Float, nullable=False)  # Average, scaled to 0-100
    
    # Feedback text
    feedback_text = Column(Text, nullable=False)
    suggestions = Column(Text, nullable=True)  # JSON array of suggestions
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    question = relationship("InterviewQuestion", back_populates="feedback")
    
    def __repr__(self):
        return f"<AnswerFeedback(overall_score={self.overall_score})>"


class UserProgress(Base):
    """User progress model - aggregates statistics for dashboard."""
    
    __tablename__ = "user_progress"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Statistics
    total_sessions = Column(Integer, default=0)
    total_questions_answered = Column(Integer, default=0)
    average_communication_score = Column(Float, default=0.0)
    average_technical_score = Column(Float, default=0.0)
    average_problem_solving_score = Column(Float, default=0.0)
    average_professional_tone_score = Column(Float, default=0.0)
    overall_average_score = Column(Float, default=0.0)
    
    # Timestamps
    last_activity = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<UserProgress(user_id={self.user_id}, total_sessions={self.total_sessions})>"

