"""
Pydantic Schemas - Request/Response Models
==========================================

This module defines Pydantic models for API request validation and response serialization.
These models ensure data consistency between frontend and backend.

Author: LLM Interview Simulator Team
"""

from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict
from datetime import datetime


# User schemas
class UserBase(BaseModel):
    """Base user schema."""
    username: str
    email: EmailStr


class UserCreate(UserBase):
    """Schema for user creation."""
    cognito_id: str


class UserResponse(UserBase):
    """Schema for user responses."""
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True


# Interview session schemas
class SessionCreate(BaseModel):
    """Schema for creating a new interview session."""
    interview_type: str
    difficulty: str = "medium"


class SessionResponse(BaseModel):
    """Schema for session responses."""
    id: str
    interview_type: str
    difficulty: str
    status: str
    started_at: datetime
    total_questions: int
    
    class Config:
        from_attributes = True


# Question schemas
class QuestionCreate(BaseModel):
    """Schema for adding a question to a session."""
    question_text: str
    session_id: str


class QuestionResponse(BaseModel):
    """Schema for question responses."""
    id: str
    question_number: int
    question_text: str
    user_answer: Optional[str]
    is_audio: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# Answer evaluation schemas
class AnswerSubmission(BaseModel):
    """Schema for submitting an answer."""
    session_id: str
    question_id: str
    user_answer: str
    is_audio: bool = False
    audio_transcript: Optional[str] = None


class ScoreDetails(BaseModel):
    """Schema for detailed scoring."""
    communication: float
    technical_accuracy: float
    problem_solving: float
    professional_tone: float


class EvaluationResponse(BaseModel):
    """Schema for evaluation responses."""
    question_id: str
    overall_score: float
    scores: ScoreDetails
    feedback: str
    suggestions: List[str]
    interview_type: str


# Voice/audio schemas
class AudioRecordingData(BaseModel):
    """Schema for audio recording submissions."""
    session_id: str
    question_id: str
    audio_base64: str  # Base64 encoded audio
    mime_type: str = "audio/webm"


class TextToSpeechRequest(BaseModel):
    """Schema for text-to-speech requests."""
    text: str
    voice_id: str = "Joanna"  # AWS Polly voice
    output_format: str = "json"  # json or mp3


# Dashboard and analytics schemas
class ScoreStatistics(BaseModel):
    """Schema for score statistics."""
    average_communication: float
    average_technical_accuracy: float
    average_problem_solving: float
    average_professional_tone: float
    overall_average: float


class StrengthsWeaknesses(BaseModel):
    """Schema for strengths and weaknesses analysis."""
    strengths: List[str]
    weaknesses: List[str]
    recommendations: List[str]


class DashboardData(BaseModel):
    """Schema for dashboard data."""
    total_sessions: int
    total_questions_answered: int
    statistics: ScoreStatistics
    recent_sessions: List[SessionResponse]
    strengths_weaknesses: StrengthsWeaknesses


# Feedback schemas
class FeedbackDetail(BaseModel):
    """Schema for detailed feedback."""
    question_text: str
    user_answer: str
    feedback_text: str
    scores: ScoreDetails
    suggestions: List[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class SessionHistoryResponse(BaseModel):
    """Schema for session history."""
    session: SessionResponse
    questions: List[QuestionResponse]
    feedbacks: List[FeedbackDetail]


# Generic response schemas
class MessageResponse(BaseModel):
    """Schema for simple message responses."""
    message: str
    status: str = "success"


class ErrorResponse(BaseModel):
    """Schema for error responses."""
    error: str
    detail: Optional[str] = None
    status_code: int
