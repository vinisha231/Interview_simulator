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

# Import Bedrock service
from app.services.bedrock_service import get_bedrock_service

# Create a router for interview-related endpoints
# prefix="/api/interview" means all routes will start with /api/interview/
# tags=["interview"] groups these endpoints in the API documentation
router = APIRouter(prefix="/api/interview", tags=["interview"])

# LeetCode-style coding question bank by company and difficulty (questions that require code)
# Based on commonly asked problems at these companies. Use for technical interviews.
LEETCODE_STYLE_QUESTIONS = {
    "google": {
        "easy": [
            "Two Sum: Given an array of integers and a target, return indices of the two numbers that add up to the target. Assume exactly one solution. Write the function signature and implement it.",
            "Valid Parentheses: Given a string containing only '(', ')', '{', '}', '[' and ']', determine if the input is valid (open brackets closed in correct order). Write code to solve this.",
            "Merge Two Sorted Lists: Given the heads of two sorted linked lists, merge them into one sorted list. Return the head of the merged list. Implement the solution.",
            "Reverse a linked list. Write a function that takes the head node and returns the new head.",
            "Implement a function to check if a string is a palindrome. Ignore non-alphanumeric characters and case.",
        ],
        "medium": [
            "Longest Substring Without Repeating Characters: Given a string, find the length of the longest substring without repeating characters. Implement and state time/space complexity.",
            "3Sum: Given an integer array, find all unique triplets that sum to zero. Describe approach and write the core logic.",
            "Add Two Numbers: You are given two non-empty linked lists representing non-negative integers (digits in reverse order). Add them and return the sum as a linked list. Implement it.",
            "Container With Most Water: Given n non-negative integers representing vertical lines, find two lines that form a container holding the most water. Write the algorithm.",
            "Implement a function to group anagrams together. Given a list of strings, return grouped lists. State time and space complexity.",
        ],
        "hard": [
            "Merge k Sorted Lists: Given an array of k linked lists (each sorted), merge them into one sorted list. Implement and analyze time/space complexity.",
            "Trapping Rain Water: Given n non-negative integers representing an elevation map, compute how much water it can trap after raining. Write the solution and Big-O.",
            "Find the median of two sorted arrays of size m and n. Implement and state time complexity (aim for O(log(min(m,n)))).",
            "Serialize and Deserialize a Binary Tree: Design an algorithm to serialize and deserialize a binary tree. Write the code.",
        ],
    },
    "amazon": {
        "easy": [
            "Two Sum: Given an array and a target, return indices of two numbers that add up to the target. Implement the function.",
            "Valid Parentheses: Check if a string of brackets is valid. Write the code.",
            "Reverse a string in-place (or reverse words in a sentence). Implement it.",
            "Implement a function to detect a cycle in a linked list. Return the node where the cycle begins or null.",
            "Maximum depth of a binary tree. Write a recursive or iterative solution.",
        ],
        "medium": [
            "LRU Cache: Design and implement a data structure for Least Recently Used (LRU) cache. Support get and put in O(1). Describe and code.",
            "Longest Substring Without Repeating Characters: Find length of longest substring with no repeating characters. Implement and give complexity.",
            "Number of Islands: Given a 2D grid of '1's and '0's, count the number of islands. Write BFS/DFS solution.",
            "Copy List with Random Pointer: Deep copy a linked list where each node has a random pointer. Implement it.",
            "Word Break: Given a string and a dictionary of words, determine if the string can be segmented into dictionary words. Write the solution.",
        ],
        "hard": [
            "Merge k Sorted Lists: Merge k sorted linked lists into one sorted list. Implement and analyze.",
            "Trapping Rain Water: Compute how much water can be trapped given elevation array. Write code and Big-O.",
            "Word Ladder II: Given begin word, end word, and word list, find all shortest transformation sequences. Implement BFS/DFS.",
        ],
    },
    "microsoft": {
        "easy": [
            "Two Sum: Return indices of two numbers that add up to target. Implement.",
            "Valid Parentheses: Check if bracket string is valid. Write code.",
            "Merge Two Sorted Lists: Merge two sorted linked lists. Implement.",
            "Maximum depth of binary tree. Write solution.",
            "Implement strStr(): Return index of first occurrence of needle in haystack, or -1. Write the function.",
        ],
        "medium": [
            "Add Two Numbers (linked list): Add two numbers represented as reversed linked lists. Implement.",
            "Longest Substring Without Repeating Characters: Find length of longest substring without repeats. Code and complexity.",
            "Reverse Linked List II: Reverse a portion of a linked list from position left to right. Implement.",
            "Binary Tree Level Order Traversal: Return level-order traversal of a binary tree. Write BFS solution.",
            "Set Matrix Zeroes: Given a matrix, set entire row and column to 0 if an element is 0. Do in place if possible. Implement.",
        ],
        "hard": [
            "Merge k Sorted Lists: Merge k sorted lists. Implement and state complexity.",
            "Trapping Rain Water: Compute trapped water. Implement with O(n) time.",
            "Serialize and Deserialize Binary Tree: Design serialization format and implement encode/decode.",
        ],
    },
    "meta": {
        "easy": [
            "Two Sum: Given array and target, return indices of two numbers that sum to target. Implement.",
            "Valid Parentheses: Check valid bracket sequence. Write code.",
            "Merge Two Sorted Lists: Merge two sorted linked lists. Implement.",
            "Maximum depth of binary tree. Write recursive/iterative solution.",
            "Best Time to Buy and Sell Stock: One transaction, find max profit. Implement.",
        ],
        "medium": [
            "Add Two Numbers (linked lists): Add two numbers as reversed linked lists. Implement.",
            "Longest Substring Without Repeating Characters: Length of longest substring without repeating chars. Code + complexity.",
            "3Sum: Find all unique triplets that sum to zero. Implement and optimize.",
            "Binary Tree Level Order Traversal: Return level-order traversal. Write BFS.",
            "Lowest Common Ancestor of a Binary Tree: Given tree and two nodes, find LCA. Implement.",
        ],
        "hard": [
            "Merge k Sorted Lists: Merge k sorted lists. Implement.",
            "Trapping Rain Water: Compute trapped water. Implement.",
            "Serialize and Deserialize Binary Tree: Design and implement serialize/deserialize.",
        ],
    },
    "apple": {
        "easy": [
            "Two Sum: Return indices of two numbers that add to target. Implement.",
            "Valid Parentheses: Check valid brackets. Write code.",
            "Merge Two Sorted Lists: Merge two sorted lists. Implement.",
            "Reverse a linked list. Implement.",
            "Implement a queue using two stacks. Write enqueue and dequeue.",
        ],
        "medium": [
            "Longest Substring Without Repeating Characters: Find length. Implement and state complexity.",
            "Add Two Numbers (linked lists): Add two numbers. Implement.",
            "LRU Cache: Design get/put in O(1). Implement.",
            "Number of Islands: Count islands in 2D grid. Write BFS/DFS.",
            "Group Anagrams: Group strings that are anagrams. Implement.",
        ],
        "hard": [
            "Merge k Sorted Lists: Merge k sorted lists. Implement.",
            "Trapping Rain Water: Compute trapped water. Implement.",
            "Serialize and Deserialize Binary Tree: Implement.",
        ],
    },
    "netflix": {
        "easy": [
            "Two Sum: Indices of two numbers that sum to target. Implement.",
            "Valid Parentheses: Valid bracket string. Implement.",
            "Merge Two Sorted Lists: Merge two sorted lists. Implement.",
            "Reverse a linked list. Implement.",
        ],
        "medium": [
            "Longest Substring Without Repeating Characters: Implement and give complexity.",
            "LRU Cache: Design and implement. O(1) get/put.",
            "Group Anagrams: Group anagrams. Implement.",
            "Number of Islands: Count islands. BFS/DFS.",
        ],
        "hard": [
            "Merge k Sorted Lists: Implement and analyze.",
            "Trapping Rain Water: Implement.",
        ],
    },
}
# General pool when company not in bank (still coding questions)
LEETCODE_STYLE_GENERAL = {
    "easy": [
        "Two Sum: Given an array of integers and a target, return indices of the two numbers that add up to the target. Write the function and implement it.",
        "Valid Parentheses: Given a string of brackets, determine if it is valid. Implement the solution.",
        "Merge Two Sorted Lists: Merge two sorted linked lists and return the head of the merged list. Write code.",
        "Reverse a linked list. Implement a function that takes the head and returns the new head.",
        "Maximum Depth of Binary Tree: Given root, return maximum depth. Write recursive or iterative solution.",
    ],
    "medium": [
        "Longest Substring Without Repeating Characters: Find the length of the longest substring without repeating characters. Implement and state time/space complexity.",
        "Add Two Numbers: Two linked lists represent numbers in reverse. Add them and return sum as linked list. Implement.",
        "3Sum: Find all unique triplets in the array that sum to zero. Implement and state complexity.",
        "Container With Most Water: Find two lines that form the container with most water. Write the algorithm.",
        "Group Anagrams: Group strings that are anagrams. Implement and give complexity.",
    ],
    "hard": [
        "Merge k Sorted Lists: Merge k sorted linked lists into one. Implement and state time/space complexity.",
        "Trapping Rain Water: Given elevation map, compute how much water can be trapped. Implement with O(n) time.",
        "Find Median of Two Sorted Arrays: Compute median in O(log(min(m,n))). Describe approach and implement.",
    ],
}

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
    
    Attributes:
        feedback (str): Detailed feedback (starts with something strong)
        score (int): Numerical score (0-100)
        suggestions (List[str]): Improvement suggestions
        strength_highlight (str, optional): One sentence on what they did well (for dashboard)
    """
    feedback: str
    score: int
    suggestions: List[str]
    strength_highlight: Optional[str] = None

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
    company: Optional[str] = None,
    language: Optional[str] = None,
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
    # For technical interviews: use LeetCode-style coding questions (require code) from company/difficulty bank
    if interview_type == "technical":
        diff_key = difficulty if difficulty in ("easy", "medium", "hard") else "medium"
        company_key = (company or "").strip().lower().replace(" ", "") if company else ""
        if company_key == "facebook":
            company_key = "meta"
        if company_key and company_key in LEETCODE_STYLE_QUESTIONS:
            bank = LEETCODE_STYLE_QUESTIONS[company_key].get(diff_key, LEETCODE_STYLE_GENERAL[diff_key])
        else:
            bank = LEETCODE_STYLE_GENERAL.get(diff_key, LEETCODE_STYLE_GENERAL["medium"])
        question = random.choice(bank)
        return {
            "question": question,
            "interview_type": interview_type,
            "difficulty": diff_key,
            "role": role,
            "company": company,
            "model": "leetcode-style",
        }

    fallback = {
        "technical": {
            "easy": LEETCODE_STYLE_GENERAL["easy"],
            "medium": LEETCODE_STYLE_GENERAL["medium"],
            "hard": LEETCODE_STYLE_GENERAL["hard"],
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

    question = None
    model_id = "local-fallback"
    try:
        bedrock = get_bedrock_service()
        question = bedrock.generate_question(
            interview_type=interview_type,
            difficulty=difficulty,
            role=role,
            company=company,
            language=language,
        )
        model_id = getattr(bedrock, "model_id", "bedrock")
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning("Bedrock generate_question failed, using fallback: %s", e)

    if not question:
        safe_type = interview_type if interview_type in fallback else "technical"
        safe_level = difficulty if difficulty in fallback.get(safe_type, fallback["technical"]) else "medium"
        questions_list = fallback.get(safe_type, fallback["technical"]).get(safe_level, fallback["technical"]["medium"])
        question = random.choice(questions_list)

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
    def is_low_quality_answer(answer: str, interview_type: str) -> bool:
        cleaned = answer.strip()
        if len(cleaned) < 3:
            return True
        # For technical/design, allow concise and code-heavy answers; only reject truly empty
        if (interview_type or "").lower() in ("technical", "design"):
            return len(cleaned) < 3
        tokens = re.findall(r"[A-Za-z]+", cleaned)
        if len(tokens) < 2:
            return True
        unique_ratio = len(set(t.lower() for t in tokens)) / max(len(tokens), 1)
        alpha_ratio = sum(1 for c in cleaned if c.isalpha()) / max(len(cleaned), 1)
        # Relaxed: allow code/symbols (lower alpha), some repetition (lower unique_ratio)
        if unique_ratio < 0.2 or alpha_ratio < 0.35:
            return True
        return False

    if is_low_quality_answer(request.user_answer, request.interview_type):
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
        
        # Use AI rubric-based score and feedback as the single source of truth
        if "overall_score" in evaluation and evaluation["overall_score"] is not None:
            final_score = max(0, min(100, int(evaluation["overall_score"])))
        else:
            communication = evaluation.get("communication_score", 3)
            technical = evaluation.get("technical_score", 3)
            problem_solving = evaluation.get("problem_solving_score", 3)
            professional = evaluation.get("professional_tone_score", 3)
            final_score = int(((communication + technical + problem_solving + professional) / 4) * 20)

        suggestions = evaluation.get("suggestions", [])
        feedback_text = evaluation.get("feedback", "No feedback provided.")
        strength_highlight = evaluation.get("strength_highlight") or ""

        return InterviewResponse(
            feedback=feedback_text,
            score=final_score,
            suggestions=suggestions,
            strength_highlight=strength_highlight
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
