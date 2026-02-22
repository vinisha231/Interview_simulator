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
import random
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
    role: Optional[str] = None
    company: Optional[str] = None

# Follow-up request for conversational behavioral interviews
class FollowupRequest(BaseModel):
    question: str
    user_answer: str
    interview_type: Optional[str] = "behavioral"
    role: Optional[str] = None
    company: Optional[str] = None
    history: Optional[List[dict]] = None

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
    fallback = {
        "technical": {
            "easy": [
                "Explain the difference between a stack and a queue.",
                "What is an API and why is it useful?",
                "What is a database index and what problem does it solve?"
            ],
            "medium": [
                "How would you design a URL shortener? Outline key components.",
                "Describe how caching can improve performance and where you'd use it.",
                "Explain the difference between SQL and NoSQL databases with examples."
            ],
            "hard": [
                "Design a rate limiter for a high-traffic API.",
                "How would you detect and prevent race conditions in a distributed system?",
                "Design a system for real-time collaboration on documents."
            ]
        },
        "behavioral": {
            "easy": [
                "Tell me about yourself.",
                "Describe a time you worked on a team project.",
                "What motivates you in your work?"
            ],
            "medium": [
                "Tell me about a time you faced a conflict at work and how you handled it.",
                "Describe a situation where you had to prioritize multiple tasks.",
                "Tell me about a time you made a mistake and what you learned."
            ],
            "hard": [
                "Describe a time you led a difficult project to success.",
                "Tell me about a time you had to persuade stakeholders to change direction.",
                "Describe a time you had to make a decision with limited data."
            ]
        },
        "design": {
            "easy": [
                "Design a simple to-do list app. What are the main components?",
                "How would you design a basic URL shortener at a high level?",
                "Design a simple messaging app with one-on-one chats."
            ],
            "medium": [
                "Design a ride-sharing service at a high level.",
                "Design a file storage system like Dropbox.",
                "Design a news feed system with personalization."
            ],
            "hard": [
                "Design a global video streaming platform.",
                "Design a large-scale search engine.",
                "Design a real-time analytics system for millions of events per second."
            ]
        }
    }

    try:
        bedrock = get_bedrock_service()
        question = bedrock.generate_question(
            interview_type=interview_type,
            difficulty=difficulty,
            role=role,
            company=company
        )
        model_id = bedrock.model_id
    except Exception:
        safe_type = interview_type if interview_type in fallback else "technical"
        safe_level = difficulty if difficulty in fallback[safe_type] else "medium"
        question = random.choice(fallback[safe_type][safe_level])
        model_id = "local-fallback"

    return {
        "question": question,
        "interview_type": interview_type,
        "difficulty": difficulty,
        "role": role,
        "company": company,
        "model": model_id
    }

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

    def star_rubric_adjustment(answer: str) -> dict:
        text = answer.strip()
        lower = text.lower()
        penalties = 0
        notes = []

        # Detect STAR sections by common labels or keywords.
        markers = {
            "s": [r"\bsituation\b", r"\bs\:", r"\bsituation\:"],
            "t": [r"\btask\b", r"\bt\:", r"\btask\:"],
            "a": [r"\baction\b", r"\ba\:", r"\baction\:"],
            "r": [r"\bresult\b", r"\br\:", r"\bresult\:"]
        }

        positions = {}
        for key, patterns in markers.items():
            pos = None
            for pat in patterns:
                m = re.search(pat, lower)
                if m:
                    pos = m.start()
                    break
            positions[key] = pos

        missing = [k for k, v in positions.items() if v is None]
        if missing:
            penalties += 20 * len(missing)
            notes.append(
                "Missing STAR section(s): " +
                ", ".join([k.upper() for k in missing]) + "."
            )

        order = [positions["s"], positions["t"], positions["a"], positions["r"]]
        if all(p is not None for p in order):
            if not (order[0] < order[1] < order[2] < order[3]):
                penalties += 15
                notes.append("STAR order is out of sequence (S, T, A, R).")

        # Time-based penalty: assume ~150 words/minute.
        word_count = len(re.findall(r"\b\w+\b", text))
        if word_count > 300:
            penalties += 10
            notes.append("Answer is too long (over ~2 minutes).")
        elif word_count > 225:
            penalties += 5
            notes.append("Answer is long (over ~1.5 minutes).")

        return {"penalties": penalties, "notes": notes}

    def software_engineer_technical_rubric(answer: str) -> dict:
        text = answer.strip().lower()
        penalties = 0
        notes = []

        checks = [
            ("problem understanding", [r"\bunderstand\b", r"\bclarify\b", r"\bassumptions?\b"]),
            ("approach", [r"\bapproach\b", r"\bplan\b", r"\bstrategy\b"]),
            ("complexity", [r"\btime\b", r"\bspace\b", r"\bcomplexity\b", r"\bbig[- ]o\b"]),
            ("edge cases", [r"\bedge\b", r"\bcorner\b", r"\bcase\b"]),
            ("examples/tests", [r"\bexample\b", r"\btest\b", r"\binput\b", r"\boutput\b"])
        ]

        for label, patterns in checks:
            if not any(re.search(p, text) for p in patterns):
                penalties += 10
                notes.append(f"Missing {label}.")

        # Simple order check: understanding -> approach -> complexity -> edge cases
        order_patterns = [r"\bunderstand\b|\bclarify\b|\bassumptions?\b",
                          r"\bapproach\b|\bplan\b|\bstrategy\b",
                          r"\btime\b|\bspace\b|\bcomplexity\b|\bbig[- ]o\b",
                          r"\bedge\b|\bcorner\b|\bcase\b"]
        positions = []
        for pat in order_patterns:
            m = re.search(pat, text)
            positions.append(m.start() if m else None)
        if all(p is not None for p in positions):
            if not (positions[0] < positions[1] < positions[2] < positions[3]):
                penalties += 10
                notes.append("Technical response order is out of sequence.")

        return {"penalties": penalties, "notes": notes}

    def software_engineer_design_rubric(answer: str) -> dict:
        text = answer.strip().lower()
        penalties = 0
        notes = []

        checks = [
            ("requirements", [r"\brequirements?\b", r"\bconstraints?\b", r"\bgoals?\b"]),
            ("high-level design", [r"\bhigh[- ]level\b", r"\bcomponents?\b", r"\barchitecture\b"]),
            ("data flow", [r"\bdata flow\b", r"\brequest\b", r"\bresponse\b", r"\bpipeline\b"]),
            ("scalability", [r"\bscale\b", r"\bscalable\b", r"\bthroughput\b", r"\blatency\b"]),
            ("trade-offs", [r"\btrade[- ]off\b", r"\bpros\b", r"\bcons\b", r"\bdecision\b"])
        ]

        for label, patterns in checks:
            if not any(re.search(p, text) for p in patterns):
                penalties += 10
                notes.append(f"Missing {label}.")

        order_patterns = [r"\brequirements?\b|\bconstraints?\b|\bgoals?\b",
                          r"\bhigh[- ]level\b|\bcomponents?\b|\barchitecture\b",
                          r"\bdata flow\b|\brequest\b|\bresponse\b|\bpipeline\b",
                          r"\bscale\b|\bscalable\b|\bthroughput\b|\blatency\b",
                          r"\btrade[- ]off\b|\bpros\b|\bcons\b|\bdecision\b"]
        positions = []
        for pat in order_patterns:
            m = re.search(pat, text)
            positions.append(m.start() if m else None)
        if all(p is not None for p in positions):
            if not (positions[0] < positions[1] < positions[2] < positions[3] < positions[4]):
                penalties += 10
                notes.append("Design response order is out of sequence.")

        return {"penalties": penalties, "notes": notes}

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
        
        feedback_text = evaluation.get("feedback", "No feedback provided.")
        final_score = overall_score

        if request.interview_type in ["behavioral", "design"]:
            star = star_rubric_adjustment(request.user_answer)
            if star["penalties"]:
                final_score = max(0, overall_score - star["penalties"])
                feedback_text += " STAR rubric notes: " + " ".join(star["notes"])

        role_value = (request.role or "").lower()
        if "software engineer" in role_value:
            if request.interview_type == "technical":
                tech = software_engineer_technical_rubric(request.user_answer)
                if tech["penalties"]:
                    final_score = max(0, final_score - tech["penalties"])
                    feedback_text += " Technical rubric notes: " + " ".join(tech["notes"])
            if request.interview_type == "design":
                design = software_engineer_design_rubric(request.user_answer)
                if design["penalties"]:
                    final_score = max(0, final_score - design["penalties"])
                    feedback_text += " Design rubric notes: " + " ".join(design["notes"])

        # Create and return the response
        return InterviewResponse(
            feedback=feedback_text,
            score=final_score,
            suggestions=suggestions
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error evaluating answer: {str(e)}")


@router.post("/followup")
async def followup_question(request: FollowupRequest):
    """
    Generate a conversational follow-up question based on the user's answer.
    """
    try:
        bedrock = get_bedrock_service()
        question = bedrock.generate_followup_question(
            question=request.question,
            user_answer=request.user_answer,
            interview_type=request.interview_type or "behavioral",
            role=request.role,
            company=request.company,
            history=request.history
        )
        return {
            "question": question,
            "interview_type": request.interview_type or "behavioral"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating follow-up question: {str(e)}")

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
            {"id": "design", "name": "Design Interview"},
            {"id": "coding", "name": "Coding Challenge"}
        ]
    }
