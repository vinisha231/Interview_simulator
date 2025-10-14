from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import asyncio

router = APIRouter(prefix="/api/interview", tags=["interview"])

class InterviewRequest(BaseModel):
    question: str
    user_answer: str
    interview_type: Optional[str] = "technical"

class InterviewResponse(BaseModel):
    feedback: str
    score: int
    suggestions: List[str]

@router.get("/")
async def get_interview_questions():
    """Get sample interview questions"""
    sample_questions = [
        "Explain the difference between REST and GraphQL APIs.",
        "How would you optimize a slow database query?",
        "Describe your approach to debugging a production issue.",
        "What is the difference between SQL and NoSQL databases?",
        "How do you handle errors in a distributed system?"
    ]
    return {"questions": sample_questions}

@router.post("/evaluate", response_model=InterviewResponse)
async def evaluate_answer(request: InterviewRequest):
    """Evaluate user's answer to an interview question"""
    try:
        # Simulate processing time
        await asyncio.sleep(1)
        
        # Mock evaluation logic (replace with actual LLM integration)
        feedback = f"Good attempt at answering: '{request.question}'. Your answer shows understanding of the topic."
        score = 75  # Mock score
        suggestions = [
            "Provide more specific examples",
            "Consider edge cases",
            "Explain your reasoning step by step"
        ]
        
        return InterviewResponse(
            feedback=feedback,
            score=score,
            suggestions=suggestions
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/types")
async def get_interview_types():
    """Get available interview types"""
    return {
        "types": [
            {"id": "technical", "name": "Technical Interview"},
            {"id": "behavioral", "name": "Behavioral Interview"},
            {"id": "system_design", "name": "System Design"},
            {"id": "coding", "name": "Coding Challenge"}
        ]
    }
