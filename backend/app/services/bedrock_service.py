"""
AWS Bedrock Service - AI Interview Power
========================================

This service handles all interactions with AWS Bedrock, which powers:
1. Interview questions (Technical/Behavioral)
2. Dynamic follow-up questions based on answers
3. Answer evaluation and scoring
4. Comprehensive feedback generation

Models used:
- Claude 3 Sonnet (default for best quality)
- Llama 2 (alternative, more cost-effective)

Author: LLM Interview Simulator Team
"""

import boto3
import json
from typing import Dict, List, Optional
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize Bedrock client
bedrock_runtime = boto3.client(
    'bedrock-runtime',
    region_name=os.getenv('AWS_REGION', 'us-east-1')
)

# Available models
CLAUDE_MODEL = "anthropic.claude-3-sonnet-20240229-v1:0"
LLAMA_MODEL = "meta.llama2-70b-chat-v1"


class BedrockService:
    """Service for interacting with AWS Bedrock to generate questions and evaluate answers."""
    
    def __init__(self, model_id: str = CLAUDE_MODEL):
        """
        Initialize the Bedrock service.
        
        Args:
            model_id: The Bedrock model to use (default: Claude 3 Sonnet)
        """
        self.model_id = model_id
        self.bedrock = bedrock_runtime
    
    def _invoke_model(self, prompt: str, system_prompt: str = None) -> str:
        """
        Invoke Bedrock model with a prompt.
        
        Args:
            prompt: The user prompt
            system_prompt: Optional system prompt for behavior
            
        Returns:
            The model's response text
        """
        try:
            # Prepare the message structure
            messages = [{"role": "user", "content": prompt}]
            
            if self.model_id.startswith("anthropic.claude"):
                # Claude format
                body = json.dumps({
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": 4000,
                    "messages": messages,
                    "system": system_prompt or "You are an expert interview evaluator."
                })
            else:
                # Llama format
                body = json.dumps({
                    "prompt": f"{system_prompt}\n\nUser: {prompt}\n\nAssistant:",
                    "max_gen_len": 4000
                })
            
            # Invoke the model
            response = self.bedrock.invoke_model(
                modelId=self.model_id,
                body=body
            )
            
            # Parse response
            response_body = json.loads(response['body'].read())
            
            if self.model_id.startswith("anthropic.claude"):
                return response_body['content'][0]['text']
            else:
                return response_body['generation']
                
        except Exception as e:
            print(f"Error invoking Bedrock: {str(e)}")
            raise
    
    def generate_question(
        self,
        interview_type: str,
        difficulty: str = "medium",
        previous_questions: List[str] = None,
        role: Optional[str] = None,
        company: Optional[str] = None
    ) -> str:
        """
        Generate an interview question using Bedrock.
        
        Args:
            interview_type: Type of interview (technical, behavioral, etc.)
            difficulty: Difficulty level (easy, medium, hard)
            previous_questions: List of previously asked questions
            
        Returns:
            A generated interview question
        """
        role_context = role.strip() if role else "the role"
        company_context = f" at {company.strip()}" if company and company.strip() else ""
        system_prompt = (
            f"You are an expert {interview_type} interviewer. Generate relevant, challenging "
            f"interview questions for {role_context}{company_context} that assess both technical "
            "knowledge and communication skills."
        )
        
        context = ""
        if previous_questions:
            context = f"\nYou've already asked: {', '.join(previous_questions[-3:])}\nAvoid repeating these."
        
        prompt = f"""Generate a {difficulty} difficulty {interview_type} interview question.
        Role: {role_context}{company_context}
        {context}
        
        The question should be:
        - Clear and concise
        - Appropriate for the difficulty level
        - Relevant to real-world scenarios
        
        Return ONLY the question, no additional text.
        """
        
        return self._invoke_model(prompt, system_prompt)
    
    def evaluate_answer(self, question: str, user_answer: str, interview_type: str) -> Dict:
        """
        Evaluate a user's answer using Bedrock with structured scoring.
        
        Args:
            question: The interview question
            user_answer: The user's response
            interview_type: Type of interview
            
        Returns:
            A dictionary containing feedback, scores, and suggestions
        """
        system_prompt = """You are an expert interview evaluator. Provide detailed, constructive 
        feedback and numerical scores (1-5 scale) across multiple dimensions: Communication, 
        Technical Accuracy, Problem-Solving, and Professional Tone."""
        
        prompt = f"""Evaluate this interview answer and provide:
        
        1. Overall feedback (2-3 sentences)
        2. A score from 1-5 for each dimension:
           - Communication (clarity, articulation)
           - Technical Accuracy (correctness of technical content)
           - Problem-Solving (approach and logic)
           - Professional Tone (appropriate language and demeanor)
        3. Three specific improvement suggestions
        
        Question: {question}
        Answer: {user_answer}
        Interview Type: {interview_type}
        
        Format your response as JSON:
        {{
            "feedback": "overall feedback text",
            "communication_score": <1-5>,
            "technical_score": <1-5>,
            "problem_solving_score": <1-5>,
            "professional_tone_score": <1-5>,
            "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
        }}
        
        Return ONLY valid JSON, no markdown formatting.
        """
        
        response = self._invoke_model(prompt, system_prompt)
        
        try:
            # Parse the JSON response
            result = json.loads(response)
            return result
        except json.JSONDecodeError:
            # Fallback if JSON parsing fails
            return {
                "feedback": response.split('\n')[0] if response else "Evaluation in progress.",
                "communication_score": 3,
                "technical_score": 3,
                "problem_solving_score": 3,
                "professional_tone_score": 3,
                "suggestions": ["Practice more examples", "Be more specific", "Improve clarity"]
            }
    
    def generate_followup_question(self, question: str, user_answer: str, interview_type: str) -> str:
        """
        Generate a dynamic follow-up question based on the user's answer.
        
        Args:
            question: The original question
            user_answer: The user's answer
            interview_type: Type of interview
            
        Returns:
            A relevant follow-up question
        """
        system_prompt = f"""You are an expert {interview_type} interviewer. Generate thoughtful 
        follow-up questions that dig deeper into the candidate's understanding."""
        
        prompt = f"""Original question: {question}
        Candidate's answer: {user_answer}
        
        Generate a follow-up question that:
        - Builds on their answer
        - Tests deeper understanding
        - Is relevant to {interview_type} interviews
        - Is concise and clear
        
        Return ONLY the question.
        """
        
        return self._invoke_model(prompt, system_prompt)


# Create a singleton instance
bedrock_service = BedrockService()


def get_bedrock_service() -> BedrockService:
    """Get the singleton Bedrock service instance."""
    return bedrock_service

