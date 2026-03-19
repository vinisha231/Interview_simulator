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
import logging
from typing import Dict, List, Optional
import os
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Available models (use BEDROCK_MODEL_ID in env to override)
CLAUDE_MODEL = "anthropic.claude-3-sonnet-20240229-v1:0"
CLAUDE_V2 = "anthropic.claude-3-5-sonnet-v2:0"  # Newer if available in your region
LLAMA_MODEL = "meta.llama2-70b-chat-v1"
DEFAULT_MODEL = os.getenv("BEDROCK_MODEL_ID", CLAUDE_MODEL)


def _score_1_5(value, default: int = 3):
    """Normalize a dimension score to 1-5. Invalid/missing -> default."""
    if value is None:
        return default
    try:
        x = int(round(float(value)))
        return max(1, min(5, x))
    except (TypeError, ValueError):
        return default


def _overall_from_dimensions(scores: list) -> int:
    """Compute 0-100 overall from 1-5 dimension scores. Same formula for all interview types."""
    if not scores:
        return 60
    avg = sum(scores) / len(scores)
    return max(0, min(100, int(round(avg * 20))))


def _get_bedrock_client():
    """Lazy client so env (e.g. from EB get-config) is loaded first."""
    return boto3.client(
        "bedrock-runtime",
        region_name=os.getenv("AWS_REGION", "us-east-1"),
    )


class BedrockService:
    """Service for interacting with AWS Bedrock to generate questions and evaluate answers."""

    def __init__(self, model_id: str = DEFAULT_MODEL):
        """
        Initialize the Bedrock service.

        Args:
            model_id: The Bedrock model to use (default: Claude 3 Sonnet)
        """
        self.model_id = model_id

    @property
    def bedrock(self):
        """Lazy client so env vars (e.g. from EB) are available."""
        if not hasattr(self, "_bedrock"):
            self._bedrock = _get_bedrock_client()
        return self._bedrock

    def _invoke_model(self, prompt: str, system_prompt: str = None) -> str:
        """
        Invoke Bedrock model with a prompt.

        Claude Messages API requires message content as an array of blocks: [{"type": "text", "text": "..."}].
        """
        try:
            if self.model_id.startswith("anthropic.claude"):
                # Claude Messages API: content must be array of content blocks
                messages = [
                    {"role": "user", "content": [{"type": "text", "text": prompt}]}
                ]
                body = json.dumps({
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": 1024,
                    "messages": messages,
                    "system": system_prompt or "You are an expert interview evaluator.",
                })
            else:
                # Llama 2 on Bedrock uses prompt-based format (no messages array)
                body = json.dumps({
                    "prompt": f"{system_prompt or ''}\n\nUser: {prompt}\n\nAssistant:",
                    "max_gen_len": 1024,
                })

            response = self.bedrock.invoke_model(
                modelId=self.model_id,
                body=body,
            )
            response_body = json.loads(response["body"].read())

            if self.model_id.startswith("anthropic.claude"):
                content = response_body.get("content") or []
                if isinstance(content, list) and len(content) > 0:
                    block = content[0]
                    if isinstance(block, dict) and "text" in block:
                        return block["text"].strip()
                raise ValueError("Unexpected Claude response structure")
            else:
                return (response_body.get("generation") or "").strip()

        except Exception as e:
            logger.warning("Bedrock invoke_model failed: %s", e)
            raise
    
    def generate_question(
        self,
        interview_type: str,
        difficulty: str = "medium",
        previous_questions: List[str] = None,
        role: Optional[str] = None,
        company: Optional[str] = None,
        language: Optional[str] = None,
    ) -> str:
        """
        Generate an interview question using Bedrock.

        Args:
            interview_type: Type of interview (technical, behavioral, etc.)
            difficulty: Difficulty level (easy, medium, hard)
            previous_questions: List of previously asked questions
            role: Optional role context
            company: Optional company context
            language: Optional programming language (e.g. Python, Java) to focus the question on

        Returns:
            A generated interview question
        """
        role_context = role.strip() if role else "the role"
        company_context = f" at {company.strip()}" if company and company.strip() else ""
        lang_context = ""
        if language and language.strip():
            lang_context = f" Focus on {language.strip()} (programming language). Ask about concepts, best practices, or problems relevant to {language.strip()}."
        system_prompt = (
            f"You are an expert {interview_type} interviewer. Generate relevant, challenging "
            f"interview questions for {role_context}{company_context} that assess both technical "
            "knowledge and communication skills." + lang_context
        )

        context = ""
        if previous_questions:
            context = f"\nYou've already asked: {', '.join(previous_questions[-3:])}\nAvoid repeating these."

        prompt = f"""Generate a {difficulty} difficulty {interview_type} interview question.
        Role: {role_context}{company_context}
        {f'Programming language: {language.strip()}.' if language and language.strip() else ''}
        {context}

        The question should be:
        - Clear and concise
        - Appropriate for the difficulty level
        - Relevant to real-world scenarios
        {f'- Specific to {language.strip()} (syntax, idioms, or ecosystem where relevant).' if language and language.strip() else ''}

        Return ONLY the question, no additional text.
        """

        return self._invoke_model(prompt, system_prompt)

    def _rubric_for_type(self, interview_type: str) -> str:
        """Return the evaluation rubric for the given interview type."""
        rubrics = {
            "technical": """
TECHNICAL INTERVIEW RUBRIC — Compare the candidate's answer to standard, widely-accepted solutions (e.g. textbook, LeetCode-style, or common interview answers). Score relative to that baseline.

• Problem understanding: Did they clarify the question, state assumptions, or show they understood?
• Approach & structure: Did they outline a clear approach or plan? Does it align with the standard approach for this type of problem?
• Technical accuracy: Is their solution correct compared to the canonical answer? Correct time complexity and space complexity (Big-O) are critical—compare to what the standard solution would state (e.g. O(n) time, O(1) space). Deduct for wrong or missing complexity.
• Complexity & edge cases: Did they state time and space complexity? Are those values correct compared to the baseline? Did they consider edge cases or trade-offs?
• Communication: Clarity, concision, and how easy it is to follow their reasoning.

BASELINE SCORING: Use your knowledge of correct answers (standard algorithms, known time/space complexity). overall_score 0-100 should reflect how close the candidate's answer is to that baseline—full marks only when correctness and complexity match or are very close to the standard answer; deduct clearly for wrong complexity or missing complexity analysis.
Feedback must reference the rubric and, when relevant, state what the standard/baseline answer would say (e.g. correct time/space complexity) and how the candidate compared.
Give feedback in the same style as behavioral: start with a concrete, descriptive strength (what they said or did and why it was effective), then specific, actionable feedback tied to the rubric.""",
            "behavioral": """
BEHAVIORAL INTERVIEW RUBRIC (STAR) — Score 1-5 on each dimension based on the response:
• Situation: Did they set context clearly (when, where, who was involved)?
• Task: Did they describe their responsibility or the challenge?
• Action: Did they explain what THEY did (specific steps, not "we")? Enough detail?
• Result: Did they share an outcome, metric, or lesson learned?
• Overall impact & relevance: Was the example relevant to the question and convincing?
Feedback must reference the rubric: what was strong, what was missing or weak.""",
            "design": """
SYSTEM DESIGN INTERVIEW RUBRIC — Score 1-5 on each dimension based on the response:
• Requirements & scope: Did they clarify or state requirements, constraints, and scale?
• High-level design: Did they describe main components, architecture, or data flow?
• Key components & APIs: Enough detail on critical parts (e.g. storage, APIs, services)?
• Scalability & reliability: Did they consider scale, bottlenecks, replication, or failure?
• Trade-offs: Did they discuss pros/cons or design trade-offs?
Feedback must reference the rubric: what was strong, what was missing or weak.
Give feedback in the same style as behavioral: start with a concrete, descriptive strength (what they said or did and why it was effective), then specific, actionable feedback tied to the rubric.""",
        }
        return rubrics.get(
            interview_type.lower(),
            "Score 1-5 on: Communication, Technical Accuracy, Problem-Solving, Professional Tone. Feedback must be specific to the response."
        )

    def evaluate_answer(self, question: str, user_answer: str, interview_type: str) -> Dict:
        """
        Evaluate an interview answer using Bedrock with rubric-based scoring and feedback.
        """
        normalized_type = (interview_type or "").lower()
        rubric = self._rubric_for_type(interview_type)
        system_prompt = """You are an expert interview evaluator. Score and give feedback strictly
        based on the provided rubric for this interview type. Always start feedback with a
        descriptive strength: something specific the candidate said or did that was strong. Then
        give constructive feedback tied to the rubric criteria."""
        
        baseline_note = (
            " For TECHNICAL: compare the answer to the standard/canonical solution (e.g. correct time/space complexity); score 0-100 relative to that baseline."
            if normalized_type == "technical" else ""
        )
        is_behavioral = normalized_type == "behavioral"

        if is_behavioral:
            scoring_instruction = (
                "3. Score each STAR dimension 1-5 (Situation, Task, Action, Result) and provide brief 1-2 sentence feedback "
                "for each dimension.\n"
                "   - situation_score, task_score, action_score, result_score\n"
                "   - situation_feedback, task_feedback, action_feedback, result_feedback"
            )
            json_fields = """
    "situation_score": <1-5>,
    "task_score": <1-5>,
    "action_score": <1-5>,
    "result_score": <1-5>,
    "situation_feedback": "<1-2 sentences>",
    "task_feedback": "<1-2 sentences>",
    "action_feedback": "<1-2 sentences>",
    "result_feedback": "<1-2 sentences>","""
        else:
            scoring_instruction = (
                "3. Score each dimension 1-5 (map rubric dimensions to: communication_score, technical_score, "
                "problem_solving_score, professional_tone_score)."
            )
            json_fields = """
    "communication_score": <1-5>,
    "technical_score": <1-5>,
    "problem_solving_score": <1-5>,
    "professional_tone_score": <1-5>,"""

        prompt = f"""Evaluate this interview answer using the rubric below. Score and provide feedback
        based only on the candidate's response and the rubric.{baseline_note}

{rubric}

CONSISTENT SCORING RULES (apply the same way for technical and behavioral):
- For non-answers (e.g. "hello world", "whatever", single words, placeholder text, or clearly irrelevant/short replies): score EVERY dimension 1. This keeps scores consistent across interview types (e.g. ~5-20%).
- For real but weak answers: use 1-3 per dimension. For good answers: 3-5. Be consistent so that similar quality gets similar scores regardless of interview type.
- You MUST output each dimension score as an integer 1-5. The overall_score will be computed from these (average of dimensions × 20), so do not try to set overall_score arbitrarily.

1. strength_highlight: One to two descriptive sentences on what the candidate did well (for non-answers, note that the response was too short to evaluate).
2. feedback: Start with that strength, then 2-3 sentences of feedback that reference the rubric (what met criteria, what was missing or could improve).
{scoring_instruction}
4. overall_score: Set to: round(average of all dimension scores × 20). So 4 dimensions averaging 1 → 20, averaging 2.5 → 50, averaging 5 → 100. Keep this formula consistent.
5. suggestions: Three specific improvement suggestions tied to the rubric.

Question: {question}
Answer: {user_answer}
Interview Type: {interview_type}

Format your response as JSON:
{{
    "strength_highlight": "1-2 sentences on what they did well",
    "feedback": "Strength first, then rubric-based feedback.",
{json_fields}
    "overall_score": <0-100, must be average of dimension scores × 20>,
    "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
}}

Return ONLY valid JSON, no markdown formatting.
"""
        
        response = self._invoke_model(prompt, system_prompt)
        
        try:
            result = json.loads(response)
            # Always compute overall_score from dimension scores for consistency (same formula for all types)
            if is_behavioral:
                s = _score_1_5(result.get("situation_score"), 1)
                t = _score_1_5(result.get("task_score"), 1)
                a = _score_1_5(result.get("action_score"), 1)
                r = _score_1_5(result.get("result_score"), 1)
                result["overall_score"] = _overall_from_dimensions([s, t, a, r])
            else:
                c = _score_1_5(result.get("communication_score"), 1)
                te = _score_1_5(result.get("technical_score"), 1)
                p = _score_1_5(result.get("problem_solving_score"), 1)
                pr = _score_1_5(result.get("professional_tone_score"), 1)
                result["overall_score"] = _overall_from_dimensions([c, te, p, pr])
            return result
        except json.JSONDecodeError:
            first_line = response.split('\n')[0] if response else "Evaluation in progress."
            if is_behavioral:
                fallback = {
                    "strength_highlight": "You provided a complete STAR example with relevant context.",
                    "feedback": first_line,
                    "situation_score": 3,
                    "task_score": 3,
                    "action_score": 3,
                    "result_score": 3,
                    "situation_feedback": "The situation context is present, but could be clearer or more specific.",
                    "task_feedback": "Your responsibility/challenge is addressed, but could be more explicit.",
                    "action_feedback": "You describe actions, but could add more specific steps and details.",
                    "result_feedback": "You share an outcome/lesson, but could add more concrete results or metrics.",
                    "suggestions": ["Add more specific context", "Be clearer about your responsibility", "Include measurable outcomes"]
                }
                fallback["overall_score"] = _overall_from_dimensions([3, 3, 3, 3])
                return fallback

            fallback = {
                "strength_highlight": "You provided a complete answer with relevant content.",
                "feedback": first_line,
                "communication_score": 3,
                "technical_score": 3,
                "problem_solving_score": 3,
                "professional_tone_score": 3,
                "suggestions": ["Practice more examples", "Be more specific", "Improve clarity"]
            }
            fallback["overall_score"] = _overall_from_dimensions([3, 3, 3, 3])
            return fallback
    
    def generate_followup_question(
        self,
        question: str,
        user_answer: str,
        interview_type: str,
        role: Optional[str] = None,
        company: Optional[str] = None,
        history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """
        Generate a dynamic follow-up question based on the user's answer.
        
        Args:
            question: The original question
            user_answer: The user's answer
            interview_type: Type of interview
            
        Returns:
            A relevant follow-up question
        """
        role_context = role.strip() if role else "the role"
        company_context = f" at {company.strip()}" if company and company.strip() else ""
        system_prompt = (
            f"You are an expert {interview_type} interviewer. Generate thoughtful follow-up "
            f"questions for {role_context}{company_context} that dig deeper into the candidate's "
            "understanding."
        )
        
        history_context = ""
        if history:
            summarized = "\n".join(
                [f"Q: {item.get('question','')}\nA: {item.get('answer','')}" for item in history[-5:]]
            )
            history_context = f"\nConversation so far:\n{summarized}\n"
        
        technical_instruction = ""
        if (interview_type or "").lower() == "technical":
            technical_instruction = """
        For technical interviews, the follow-up MUST be about time and space complexity. If the candidate has NOT yet discussed complexity, return exactly: "What is the time complexity and space complexity of your approach?" If they already discussed complexity, return one of: "How would you improve the time or space complexity?" or "Can you analyze the Big-O of an alternative approach?" or a short question asking for optimization. Do not add extra text—return ONLY the question.
        """
        
        prompt = f"""Original question: {question}
        Candidate's answer: {user_answer}
        {history_context}
        
        Generate a follow-up question that:
        - Builds on their answer
        - Tests deeper understanding
        - Is relevant to {interview_type} interviews
        - Is concise and clear
        {technical_instruction}
        
        Return ONLY the question.
        """
        
        return self._invoke_model(prompt, system_prompt)

    def extract_themes(self, texts: List[str], kind: str) -> List[str]:
        """
        Use Bedrock to extract 5 useful theme phrases (1-2 words each) from feedback text.
        kind is 'strengths' or 'weaknesses'. Returns phrases that are actionable and meaningful
        (e.g. "clear communication", "time management" not generic words like "missing" or "good").
        """
        if not texts or not any(t and t.strip() for t in texts):
            return []
        combined = "\n".join(t.strip() for t in texts if t and t.strip())[:6000]
        system_prompt = (
            "You are an expert career coach. You extract concise, useful theme labels from feedback. "
            "Output only short phrases that would help the user understand their main strengths or areas to work on. "
            "Use 1-2 words per theme. Prefer actionable terms (e.g. 'clear communication', 'code structure', 'time management'). "
            "Avoid vague or unhelpful words like 'missing', 'good', 'need', 'better'. "
            "Return exactly 5 themes, one per line, no numbering or bullets."
        )
        prompt = (
            f"From the following {kind} feedback, identify the 5 most useful theme phrases (1-2 words each). "
            "Each theme should be meaningful and actionable.\n\n"
            f"Feedback:\n{combined}\n\n"
            "List exactly 5 themes, one per line:"
        )
        try:
            out = self._invoke_model(prompt, system_prompt)
            themes = [
                line.strip().strip(".-) ")
                for line in (out or "").split("\n")
                if line.strip()
            ][:5]
            return [t for t in themes if t]
        except Exception as e:
            logger.warning("Bedrock extract_themes failed: %s", e)
            return []


# Create a singleton instance
bedrock_service = BedrockService()


def get_bedrock_service() -> BedrockService:
    """Get the singleton Bedrock service instance."""
    return bedrock_service

