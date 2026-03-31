"""
Print total registered users (run from backend root with DATABASE_URL set).

  cd backend && python scripts/count_users.py
"""
from __future__ import annotations

import sys
from pathlib import Path

_backend_root = Path(__file__).resolve().parent.parent
if str(_backend_root) not in sys.path:
    sys.path.insert(0, str(_backend_root))

from dotenv import load_dotenv  # noqa: E402

load_dotenv(_backend_root / ".env")

from sqlalchemy import func  # noqa: E402
from sqlalchemy.exc import OperationalError  # noqa: E402

import app.database  # noqa: F401, E402
from app.database import SessionLocal  # noqa: E402
from app.models.user import User  # noqa: E402


def main() -> None:
    db = SessionLocal()
    try:
        total = db.query(func.count(User.id)).scalar() or 0
        print(f"Registered users: {total}")
    except OperationalError as e:
        raw = str(getattr(e, "orig", e) or e)
        print("Could not connect to the database.", file=sys.stderr)
        if 'role "username"' in raw or "role 'username'" in raw or "role \"username\"" in raw:
            print(
                'DATABASE_URL uses the placeholder user "username". '
                "Set a real PostgreSQL user in backend/.env (e.g. your OS login name or postgres).",
                file=sys.stderr,
            )
        else:
            print(
                "Check DATABASE_URL in backend/.env, credentials, and that PostgreSQL is reachable.",
                file=sys.stderr,
            )
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
