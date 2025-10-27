"""
Evaluation Service - Scoring and Feedback
=========================================

This service provides comprehensive answer evaluation using AWS Bedrock.
It scores answers across multiple dimensions and generates detailed feedback.

Author: LLM Interview Simulator Team
"""

from typing import Dict, List
from .bedrock_service import get_bedrock_service


class EvaluationService:
    """Service for evaluating interview answers and generating feedback."""
    
    def __init__(self):
        self.bedrock = get_bedrock_service()
    
    def evaluate_answer(self, question: str, user_answer: str, interview_type: str = "technical") -> Dict:
        """
        Evaluate an interview answer across multiple dimensions.
        
        Args:
            question: The interview question
            user_answer: The user's response
            interview_type: Type of interview (technical, behavioral, etc.)
            
        Returns:
            Dictionary with feedback, scores, and suggestions
        """
        # Use Bedrock to evaluate the answer
        result = self.bedrock.evaluate_answer(question, user_answer, interview_type)
        
        # Calculate overall score (average of all dimensions)
        scores = [
            result.get("communication_score", 3),
            result.get("technical_score", 3),
            result.get("problem_solving_score", 3),
            result.get("professional_tone_score", 3)
        ]
        overall_score = round(sum(scores) / len(scores) * 20)  # Convert 1-5 to 0-100 scale
        
        return {
            "question": question,
            "user_answer": user_answer,
            "feedback": result.get("feedback", "Thank you for your answer."),
            "overall_score": overall_score,
            "scores": {
                "communication": result.get("communication_score", 3),
                "technical_accuracy": result.get("technical_score", 3),
                "problem_solving": result.get("problem_solving_score", 3),
                "professional_tone": result.get("professional_tone_score", 3)
            },
            "suggestions": result.get("suggestions", []),
            "interview_type": interview_type
        }
    
    def identify_strengths_weaknesses(self, evaluation_history: List[Dict]) -> Dict:
        """
        Analyze evaluation history to identify user strengths and weaknesses.
        
        Args:
            evaluation_history: List of previous evaluation results
            
        Returns:
            Dictionary with strengths, weaknesses, and recommendations
        """
        if not evaluation_history:
            return {
                "strengths": [],
                "weaknesses": [],
                "recommendations": []
            }
        
        # Aggregate scores across all evaluations
        avg_scores = {
            "communication": [],
            "technical_accuracy": [],
            "problem_solving": [],
            "professional_tone": []
        }
        
        for eval_result in evaluation_history:
            if "scores" in eval_result:
                for key in avg_scores.keys():
                    avg_scores[key].append(eval_result["scores"].get(key, 3))
        
        # Calculate averages
        avg_values = {
            key: sum(values) / len(values) if values else 3
            for key, values in avg_scores.items()
        }
        
        # Identify strengths (scores > 4) and weaknesses (scores < 3)
        strengths = [k for k, v in avg_values.items() if v >= 4]
        weaknesses = [k for k, v in avg_values.items() if v < 3]
        
        # Generate recommendations
        recommendations = []
        if weaknesses:
            for weak in weaknesses:
                if weak == "communication":
                    recommendations.append("Practice articulating your thoughts more clearly")
                elif weak == "technical_accuracy":
                    recommendations.append("Review technical fundamentals and terminology")
                elif weak == "problem_solving":
                    recommendations.append("Focus on structured problem-solving approaches")
                elif weak == "professional_tone":
                    recommendations.append("Work on professional language and demeanor")
        
        return {
            "strengths": strengths,
            "weaknesses": weaknesses,
            "average_scores": avg_values,
            "recommendations": recommendations
        }


# Create singleton instance
evaluation_service = EvaluationService()


def get_evaluation_service() -> EvaluationService:
    """Get the singleton evaluation service instance."""
    return evaluation_service
