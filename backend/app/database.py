import json
import os
import subprocess
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load .env from backend root (so it works even when run from project root or IDE)
_backend_root = Path(__file__).resolve().parent.parent
load_dotenv(_backend_root / ".env")


def _load_elastic_beanstalk_env() -> None:
    """On Elastic Beanstalk, Console env vars are not in os.environ. Load them via get-config."""
    get_config = "/opt/elasticbeanstalk/bin/get-config"
    if not os.path.isfile(get_config):
        return
    try:
        out = subprocess.run(
            [get_config, "environment"],
            capture_output=True,
            text=True,
            timeout=5,
        )
        if out.returncode != 0 or not out.stdout:
            return
        env = json.loads(out.stdout)
        for key, value in env.items():
            if value is not None and os.getenv(key) is None:
                os.environ[key] = str(value)
    except (json.JSONDecodeError, subprocess.TimeoutExpired, FileNotFoundError):
        pass


_load_elastic_beanstalk_env()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError(
        "❌ DATABASE_URL not set. "
        "Locally: add DATABASE_URL to backend/.env. "
        "On Elastic Beanstalk: set it in the AWS Console → EB Environment → "
        "Configuration → Software → Environment properties."
    )

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()