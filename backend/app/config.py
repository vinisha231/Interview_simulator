"""Central application configuration.

Reads environment-derived settings once so routers and middleware share a single
source of truth (e.g. whether we are running in production, which controls
security hardening like disabling API docs and enforcing a real SECRET_KEY).
"""
import os


def _env() -> str:
    return os.getenv("ENVIRONMENT", "development").strip().lower()


ENVIRONMENT = _env()
# Treat "production"/"prod" as production; everything else (development, staging,
# test) is non-production for the purposes of relaxed local defaults.
IS_PRODUCTION = ENVIRONMENT in ("production", "prod")
