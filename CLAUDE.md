# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-powered interview simulation platform using LLMs (AWS Bedrock) for technical, behavioral, and design interview practice with real-time scoring and feedback.

## Tech Stack

- **Frontend**: React 18 + Vite (port 5173)
- **Backend**: FastAPI + Python 3.11+ (port 8000)
- **Database**: PostgreSQL (AWS RDS) + SQLAlchemy + Alembic
- **LLM**: AWS Bedrock (Claude/Llama models)
- **Voice**: AWS Polly (TTS) + Transcribe (STT)
- **Auth**: JWT tokens with bcrypt password hashing

## Commands

### Backend
```bash
cd backend
pip install -r requirements.txt          # Install dependencies
python -m app.main                        # Run dev server (port 8000)
uvicorn app.main:app --reload             # Alternative with auto-reload
alembic upgrade head                      # Apply database migrations
alembic revision --autogenerate -m "msg"  # Create new migration
pytest tests/                             # Run tests
```

### Frontend
```bash
cd frontend
npm install                               # Install dependencies
npm run dev                               # Dev server (port 5173, proxies /api to :8000)
npm run build                             # Production build
```

### Both (development)
Run backend and frontend in separate terminals. Frontend proxies `/api/*` requests to backend automatically.

## Architecture

```
frontend/src/App.jsx          # Main React component (~1900 lines, manages all state)
frontend/src/interviewBox.jsx # Answer input component

backend/app/main.py           # FastAPI entry point
backend/app/routers/
  ├── interview.py            # Question generation & evaluation endpoints
  ├── sessions.py             # Interview session CRUD
  ├── dashboard.py            # Analytics & statistics
  └── auth.py                 # JWT authentication

backend/app/services/
  ├── bedrock_service.py      # AWS Bedrock LLM integration
  ├── evaluation.py           # Multi-dimensional answer scoring
  ├── polly_service.py        # Text-to-speech
  └── transcribe_service.py   # Speech-to-text

backend/app/database/
  ├── __init__.py             # Exports Base, SessionLocal, get_db
  └── db.py                   # SQLAlchemy engine and session configuration

backend/app/models/
  ├── user.py                 # User model (auth, hashed passwords)
  └── session.py              # InterviewSession model (flat Q&A with scores)
```

### Key Data Flow
1. Frontend requests question via `/api/interview/generate-question`
2. Backend calls Bedrock to generate question
3. User submits answer, frontend POSTs to `/api/interview/evaluate`
4. Evaluation service scores answer (0-100)
5. Session saved to PostgreSQL with question, answer, feedback, score
6. Dashboard aggregates stats via `/api/dashboard/stats`

### Database Models
- **User** (`app/models/user.py`): id, username, email, hashed_password, is_active, full_name
- **InterviewSession** (`app/models/session.py`): id, user_id, interview_type, difficulty, role, company, question, user_answer, feedback, score, strength_highlight, time_spent_seconds

## Environment Variables

See `backend/.env.example` for full list with descriptions.

### Backend (`backend/.env`)
```env
DATABASE_URL=postgresql://user:pass@host:5432/interview_simulator
SECRET_KEY=your-secret-key          # For JWT (auto-generated if not set, but tokens invalidate on restart)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
CORS_ORIGINS=http://localhost:5173  # Comma-separated for multiple origins
```

### Frontend
```env
# Development (frontend/.env.development)
VITE_API_BASE_URL=http://localhost:8000

# Production (frontend/.env.production) - create this for deployment
VITE_API_BASE_URL=https://your-eb-app.elasticbeanstalk.com
```

## Key Patterns

- All database operations scoped to authenticated user via `user_id`
- Pydantic models for all API request/response validation
- Async/await throughout backend
- Alembic for all schema changes (never modify DB directly)
- Structured JSON responses from Bedrock parsed in services
- JWT token passed as Bearer auth header

## Interview Types
- **technical**: Coding/algorithm questions, LeetCode-style by company (Google, Amazon, Microsoft) and difficulty
- **behavioral**: STAR method questions with follow-ups
- **design**: System design questions

## Scoring Dimensions
Each answer evaluated on:
- Communication (clarity, structure)
- Technical depth/accuracy
- Problem-solving approach
- Professional tone

Scores: 0-100%, stored per question in AnswerFeedback table.
