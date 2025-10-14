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
import asyncio  # For asynchronous operations

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
    # In a real application, these would come from a database
    sample_questions = [
        "Explain the difference between REST and GraphQL APIs.",
        "How would you optimize a slow database query?",
        "Describe your approach to debugging a production issue.",
        "What is the difference between SQL and NoSQL databases?",
        "How do you handle errors in a distributed system?"
    ]
    
    # Return the questions in a JSON response
    return {"questions": sample_questions}

# Define an endpoint to evaluate user answers
@router.post("/evaluate", response_model=InterviewResponse)
async def evaluate_answer(request: InterviewRequest):
    """
    Evaluate a user's answer to an interview question.
    
    This endpoint:
    - Responds to POST requests at /api/interview/evaluate
    - Accepts a JSON request with question, answer, and interview type
    - Returns detailed feedback, score, and suggestions
    - Currently uses mock evaluation (will be replaced with real LLM integration)
    
    Args:
        request (InterviewRequest): The interview evaluation request data
        
    Returns:
        InterviewResponse: Detailed evaluation results
        
    Raises:
        HTTPException: If there's an error during evaluation
    """
    try:
        # Simulate processing time (in real app, this would be LLM processing)
        # await asyncio.sleep(1) means "wait for 1 second"
        await asyncio.sleep(1)
        
        # Mock evaluation logic - this will be replaced with actual LLM integration
        # In a real application, this would:
        # 1. Send the question and answer to an LLM (like OpenAI GPT)
        # 2. Get detailed feedback and scoring
        # 3. Return structured results
        feedback = f"Good attempt at answering: '{request.question}'. Your answer shows understanding of the topic."
        score = 75  # Mock score (0-100 scale)
        suggestions = [
            "Provide more specific examples",
            "Consider edge cases",
            "Explain your reasoning step by step"
        ]
        
        # Create and return the response using our Pydantic model
        # This ensures the response matches our defined structure
        return InterviewResponse(
            feedback=feedback,
            score=score,
            suggestions=suggestions
        )
        
    except Exception as e:
        # If something goes wrong, return a proper HTTP error
        # This prevents the application from crashing and gives the client useful error info
        raise HTTPException(status_code=500, detail=str(e))

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
