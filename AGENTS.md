# AGENTS.md

## Cursor Cloud specific instructions

### Services overview

This is a two-service monorepo (no shared build system):

| Service | Directory | Port | Start command |
|---------|-----------|------|---------------|
| Backend (FastAPI) | `backend/` | 8000 | `uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload` |
| Frontend (React/Vite) | `frontend/` | 5173 | `npm run dev -- --host 0.0.0.0` |
| PostgreSQL | Docker | 5432 | `sudo docker start pg` (if container exists) |

### Database setup

PostgreSQL runs in a Docker container named `pg`. If the container doesn't exist yet:

```bash
sudo dockerd &>/tmp/dockerd.log &
sleep 3
sudo docker run -d --name pg \
  -e POSTGRES_USER=user -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=interview_simulator \
  -p 5432:5432 postgres:15
```

If the container already exists, start it with `sudo docker start pg`.

Tables are created via SQLAlchemy `Base.metadata.create_all()` rather than Alembic, because `alembic.ini` has a hardcoded remote RDS URL. To create/reset tables:

```bash
cd backend && python3 -c "
from app.database import Base, engine
from app.models.user import User
from app.models.session import InterviewSession
Base.metadata.create_all(bind=engine)
"
```

### Environment variables

The backend requires a `backend/.env` file. Copy from `backend/.env.example` and set `DATABASE_URL=postgresql://user:password@localhost:5432/interview_simulator`. AWS credentials are optional; the app falls back to hardcoded sample questions without them.

### Gotchas

- **`email-validator` missing from requirements.txt**: The `pydantic.EmailStr` type used in `auth.py` requires `email-validator`. Install it with `pip install email-validator`.
- **`alembic.ini` has a hardcoded RDS URL**: Do not use `alembic upgrade head` for local dev; it targets a remote database. Use SQLAlchemy `create_all()` instead (see above).
- **pip installs to `~/.local/bin`**: Ensure `$HOME/.local/bin` is on `PATH` for `uvicorn`, `alembic`, etc.
- **Docker needs special setup**: The VM runs inside a nested container, so Docker requires `fuse-overlayfs` storage driver and `iptables-legacy`. See the Docker daemon config at `/etc/docker/daemon.json`.

### Lint / Test / Build

- **Backend**: No linter or test framework is configured. Python files can be syntax-checked with `python3 -m py_compile <file>`.
- **Frontend build**: `cd frontend && npm run build`
- **Frontend dev**: `cd frontend && npm run dev`
- The `backend/tests/test_api.py` is a stub (comment only); no automated tests exist.
