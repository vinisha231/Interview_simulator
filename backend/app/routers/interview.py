"""
Interview Router - API Endpoints for Interview Functionality
===========================================================

This file contains all the API endpoints related to interview functionality.
It handles:
1. Getting sample interview questions
2. Evaluating user answers to questions
3. Providing different types of interviews

Key Concepts:
- APIRouter: Groups related endpoints together
- Pydantic Models: Define the structure of request/response data
- Async/Await: Handle multiple requests efficiently
- HTTP Methods: GET (retrieve data), POST (submit data)

Author: LLM Interview Simulator Team
"""

# Import necessary libraries
from fastapi import APIRouter, HTTPException  # FastAPI router and error handling
from pydantic import BaseModel  # Data validation and serialization
from typing import Optional, List  # Type hints for better code documentation
import re
import asyncio  # For asynchronous operations

# Import Bedrock service
from app.services.bedrock_service import get_bedrock_service

# Create a router for interview-related endpoints
# prefix="/api/interview" means all routes will start with /api/interview/
# tags=["interview"] groups these endpoints in the API documentation
router = APIRouter(prefix="/api/interview", tags=["interview"])

# Define the structure of data we expect to receive
class InterviewRequest(BaseModel):
    """
    Data model for interview evaluation requests.
    
    This defines what information the client needs to send when asking
    for an interview evaluation.
    
    Attributes:
        question (str): The interview question that was asked
        user_answer (str): The user's answer to the question
        interview_type (str, optional): Type of interview (defaults to "technical")
    """
    question: str  # Required: the interview question
    user_answer: str  # Required: the user's answer
    interview_type: Optional[str] = "technical"  # Optional: defaults to "technical"

# Define the structure of data we send back to the client
class InterviewResponse(BaseModel):
    """
    Data model for interview evaluation responses.
    
    This defines what information we send back to the client after
    evaluating their interview answer.
    
    Attributes:
        feedback (str): Detailed feedback on the user's answer
        score (int): Numerical score (0-100) for the answer
        suggestions (List[str]): List of improvement suggestions
    """
    feedback: str  # Detailed feedback message
    score: int  # Numerical score from 0-100
    suggestions: List[str]  # List of improvement suggestions

# Define an endpoint to get sample interview questions
@router.get("/")
async def get_interview_questions():
    """
    Get a list of sample interview questions.
    
    This endpoint:
    - Responds to GET requests at /api/interview/
    - Returns a list of sample technical interview questions
    - Can be used by the frontend to display question options
    
    Returns:
        dict: A dictionary containing a list of sample questions
    """
    # Sample interview questions for demonstration
    sample_questions = [
        "Explain the difference between REST and GraphQL APIs.",
        "How would you optimize a slow database query?",
        "Describe your approach to debugging a production issue.",
        "What is the difference between SQL and NoSQL databases?",
        "How do you handle errors in a distributed system?"
    ]
    
    return {"questions": sample_questions}


# Define an endpoint to generate a new interview question using Bedrock
@router.get("/generate-question")
async def generate_question(
    interview_type: str = "technical",
    difficulty: str = "medium",
    role: Optional[str] = None,
    company: Optional[str] = None
):
    """
    Generate a new interview question using AWS Bedrock.
    
    This endpoint uses Claude/Llama to generate contextual interview questions.
    
    Args:
        interview_type: Type of interview (technical, behavioral, system_design)
        difficulty: Difficulty level (easy, medium, hard)
    
    Returns:
        dict: Generated question
    """
    try:
        bedrock = get_bedrock_service()
        question = bedrock.generate_question(
            interview_type=interview_type,
            difficulty=difficulty,
            role=role,
            company=company
        )
        
        return {
            "question": question,
            "interview_type": interview_type,
            "difficulty": difficulty,
            "role": role,
            "company": company
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating question: {str(e)}")

# Define an endpoint to evaluate user answers
@router.post("/evaluate", response_model=InterviewResponse)
async def evaluate_answer(request: InterviewRequest):
    """
    Evaluate a user's answer to an interview question using AWS Bedrock.
    
    This endpoint:
    - Responds to POST requests at /api/interview/evaluate
    - Uses AWS Bedrock (Claude/Llama) to evaluate the answer
    - Returns detailed feedback, scores, and suggestions
    
    Args:
        request (InterviewRequest): The interview evaluation request data
        
    Returns:
        InterviewResponse: Detailed evaluation results
        
    Raises:
        HTTPException: If there's an error during evaluation
    """
    def is_low_quality_answer(answer: str) -> bool:
        cleaned = answer.strip()
        if len(cleaned) < 10:
            return True
        tokens = re.findall(r"[A-Za-z]+", cleaned)
        if len(tokens) < 3:
            return True
        unique_ratio = len(set(t.lower() for t in tokens)) / max(len(tokens), 1)
        alpha_ratio = sum(1 for c in cleaned if c.isalpha()) / max(len(cleaned), 1)
        if unique_ratio < 0.3 or alpha_ratio < 0.6:
            return True
        return False

    if is_low_quality_answer(request.user_answer):
        return InterviewResponse(
            feedback="Your answer is too short or unclear to evaluate. Please provide a complete, specific response.",
            score=2,
            suggestions=[
                "Answer in full sentences with concrete details.",
                "Explain your reasoning step-by-step.",
                "Stay focused on the question asked."
            ]
        )

    try:
        # Get Bedrock service instance
        bedrock = get_bedrock_service()
        
        # Evaluate the answer using Bedrock
        evaluation = bedrock.evaluate_answer(
            question=request.question,
            user_answer=request.user_answer,
            interview_type=request.interview_type
        )
        
        # Bedrock returns scores on 1-5 scale, convert to 0-100 for overall score
        communication = evaluation.get("communication_score", 3)
        technical = evaluation.get("technical_score", 3)
        problem_solving = evaluation.get("problem_solving_score", 3)
        professional = evaluation.get("professional_tone_score", 3)
        
        # Calculate overall score (average of all scores, scaled to 0-100)
        overall_score = int(((communication + technical + problem_solving + professional) / 4) * 20)
        
        # Get suggestions
        suggestions = evaluation.get("suggestions", [])
        
        # Create and return the response
        return InterviewResponse(
            feedback=evaluation.get("feedback", "No feedback provided."),
            score=overall_score,
            suggestions=suggestions
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error evaluating answer: {str(e)}")

# Define an endpoint to get available interview types
@router.get("/types")
async def get_interview_types():
    """
    Get a list of available interview types.
    
    This endpoint:
    - Responds to GET requests at /api/interview/types
    - Returns different types of interviews available
    - Can be used by the frontend to create interview type selection
    
    Returns:
        dict: A dictionary containing available interview types
    """
    # Different types of interviews the system can handle
    # Each type has an ID (for programming) and a name (for display)
    return {
        "types": [
            {"id": "technical", "name": "Technical Interview"},
            {"id": "behavioral", "name": "Behavioral Interview"},
            {"id": "system_design", "name": "System Design"},
            {"id": "coding", "name": "Coding Challenge"}
        ]
    }
