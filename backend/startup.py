"""
Azure App Service Startup Script
===============================

This file is the entry point for Azure App Service deployment.
Azure App Service looks for a file called 'startup.py' or expects
an application variable named 'application'.

Added role-based interview AI endpoint with AWS Bedrock.
"""

# --------------------------
# Existing imports
# --------------------------
import os
import sys
from pathlib import Path

# Add app directory to Python path
sys.path.insert(0, str(Path(__file__).parent / "app"))

# Import existing FastAPI app
from app.main import app

# --------------------------
# AWS Bedrock imports
# --------------------------
import boto3
from fastapi import Body
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# --------------------------
# Bedrock client setup
# --------------------------
bedrock_client = boto3.client(
    service_name='bedrock',
    region_name='us-east-1',   
    aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY')
)

# --------------------------
# Request schema
# --------------------------
class InterviewRequest(BaseModel):
    role: str          # Software Engineer / CyberSec Engineer
    level: str         # Junior / Senior
    company: str = ""   
    topic_focus: str = None   

# --------------------------
# New endpoint: generate interview questions
# --------------------------
@app.post("/generate_questions")
def generate_questions(req: InterviewRequest): 
    if req.topic_focus is None:
        focus_prompt = (
            f"Suggest 3 key focus areas for a {req.level} {req.role} interview"
            f"{' at ' + req.company if req.company else ''}."
        )
        focus_response = bedrock_client.invoke_model(
            modelId="anthropic.claude-v2",  # Replace with your chosen Bedrock model
            body=focus_prompt.encode("utf-8"),
            contentType="application/json"
        )
        req.topic_focus = focus_response['body'].read().decode('utf-8')

    # Step 2: Generate questions
    question_prompt = f"""
    You are an interview AI assistant.
    Role: {req.role}
    Level: {req.level}
    Company: {req.company}
    Focus areas: {req.topic_focus}

    Generate 5 interview questions for this role, with short hints.
    """
    response = bedrock_client.invoke_model(
        modelId="anthropic.claude-v2",
        body=question_prompt.encode("utf-8"),
        contentType="application/json"
    )
    result = response['body'].read().decode('utf-8')
    return {"questions": result}

# --------------------------
# Azure App Service requirement
# --------------------------
application = app

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(application, host="0.0.0.0", port=port)