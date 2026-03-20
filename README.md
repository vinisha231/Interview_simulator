# LLM Interview Simulator

An interview simulation platform that uses Large Language Models (LLMs) to conduct realistic technical and behavioural interviews and provide detailed feedback.

## Project Structure

- **Backend**: FastAPI-based Python server (interview API, evaluation, health checks). Lives in `backend/`.
- **Frontend**: React application (interview UI, analytics). Lives in `frontend/`.
- **Documentation**: See `docs/` for architecture, AI tools, and research notes.

## Features

- Real-time interview simulation with LLM-powered interviewer
- Comprehensive feedback scoring and analysis
- Analytics dashboard for performance tracking
- Support for various technical interview formats
- CORS, health checks, Azure and Docker deployment support

## Quick Start

### Backend

```bash
# From repo root
pip install -r requirements.txt
cd backend
# Copy .env.example to .env, set DATABASE_URL (and optionally SECRET_KEY, AWS_*)
# alembic upgrade head  # if using DB
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

- API: http://localhost:8000  
- Docs: http://localhost:8000/docs  
- Health: http://localhost:8000/health  

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Backend API (summary)

- `GET /`, `GET /health` – health and status
- `GET /api/interview/` – sample interview questions
- `POST /api/interview/evaluate` – evaluate an answer
- `GET /api/interview/types` – available interview types

## Docker

From project root:

```bash
docker build -f backend/Dockerfile -t llm-interview-simulator .
docker run -p 8000:8000 llm-interview-simulator
```

## Elastic Beanstalk (API + React from one URL)

From project root, build the frontend into `backend/app/static` and deploy the backend:

```bash
./scripts/deploy-eb-fullstack.sh
```

The UI uses same-origin `/api/...` calls (`VITE_API_BASE_URL` empty in that build).

## Azure

- **App Service**: Connect repo, set startup command `python startup.py`, set `PORT=8000` and other env vars.
- **Container**: Build/push image to ACR, then deploy container (see Azure docs).

## Configuration

Backend uses a `.env` file in `backend/` (e.g. `PORT`, `ENVIRONMENT`, `DATABASE_URL`, `SECRET_KEY`, `AWS_*`). Copy `backend/.env.example` to `backend/.env`.

## Testing (backend)

```bash
pip install pytest pytest-asyncio
cd backend && pytest tests/
```

## Troubleshooting

- **Port 8000 in use**: `lsof -ti:8000 | xargs kill -9`
- **Import errors**: Run from repo root or `backend/`; ensure deps: `pip install -r requirements.txt`
- Use http://localhost:8000/docs for interactive API testing

## Documentation

See the `docs/` directory for detailed documentation.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
