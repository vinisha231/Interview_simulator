"""
LLM Interview Simulator - Main FastAPI Application
==================================================

This is the main entry point for our FastAPI backend application.
FastAPI is a modern, fast web framework for building APIs with Python.

What this file does:
1. Creates a FastAPI application instance
2. Configures CORS (Cross-Origin Resource Sharing) for web requests
3. Includes our interview API routes
4. Defines health check endpoints
5. Sets up the server to run on AWS (Elastic Beanstalk / Lambda)

Author: LLM Interview Simulator Team
"""

# Import necessary libraries
from fastapi import FastAPI, HTTPException  # FastAPI framework for building APIs
from fastapi.middleware.cors import CORSMiddleware  # Middleware for handling CORS
from fastapi.responses import FileResponse
from app.routers import interview, sessions, dashboard, auth, activity, calendar  # Import all routers
import os  # For environment variables
from dotenv import load_dotenv  # For loading .env files
import uvicorn  # ASGI server for running FastAPI
from mangum import Mangum  # AWS Lambda adapter for ASGI apps

# Load .env from backend root so it works regardless of current working directory
from pathlib import Path
_backend_root = Path(__file__).resolve().parent.parent
load_dotenv(_backend_root / ".env")
# Load database (and on EB, inject env from get-config) before routers so Bedrock sees AWS_* and BEDROCK_MODEL_ID
import app.database  # noqa: E402, F401
from app.config import IS_PRODUCTION  # noqa: E402

# Create the FastAPI application instance
# This is the main object that handles all our API endpoints.
# Interactive docs (Swagger/ReDoc/OpenAPI schema) are disabled in production so
# the full API surface isn't published to anonymous visitors.
_docs_kwargs = {"docs_url": None, "redoc_url": None, "openapi_url": None} if IS_PRODUCTION else {}
app = FastAPI(
    title="LLM Interview Simulator",  # Title shown in API documentation
    description="A comprehensive interview simulation platform using LLMs",  # Description for docs
    version="1.0.0",  # Version number
    **_docs_kwargs,
)

# Configure CORS (Cross-Origin Resource Sharing) middleware
# CORS allows web browsers to make requests to our API from different domains
# This is essential when our frontend and backend are hosted separately
# Default to the production domain when CORS_ORIGINS is unset. Set CORS_ORIGINS
# to a comma-separated allowlist per environment.
_DEFAULT_ORIGINS = "https://vdhaya-interview-simulator.com,http://localhost:5173,http://localhost:3000"
origins_env = os.getenv("CORS_ORIGINS", _DEFAULT_ORIGINS)
_is_wildcard = origins_env.strip() == "*"
allowed_origins = ["*"] if _is_wildcard else [o.strip() for o in origins_env.split(",") if o.strip()]

# A wildcard origin cannot be combined with credentials (browsers reject it and
# it would be unsafe), so only send credentials when we have an explicit allowlist.
allow_credentials = not _is_wildcard
if _is_wildcard:
    import logging
    logging.getLogger(__name__).warning(
        "CORS_ORIGINS is '*'; credentials disabled. Set an explicit allowlist in production."
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Attach security response headers (CSP + clickjacking/sniffing protection).
from app.security_headers import add_security_headers  # noqa: E402
add_security_headers(app)

# Include all API routers
app.include_router(auth.router)
app.include_router(interview.router)
app.include_router(sessions.router)
app.include_router(dashboard.router)
app.include_router(activity.router)
app.include_router(calendar.router)

# Built React app (production): scripts/build-eb-frontend.sh copies Vite dist here
_STATIC_DIR = _backend_root / "app" / "static"


# Define the root endpoint
# This is the first endpoint users will hit when they visit our API
@app.get("/")
def root():
    """
    Serves the SPA when static assets are deployed; otherwise JSON for API-only installs.
    """
    index = _STATIC_DIR / "index.html"
    if index.is_file():
        return FileResponse(index)
    return {"message": "Backend running successfully 🚀", "status": "healthy"}

# Define a dedicated health check endpoint
# This is commonly used by monitoring systems to check if the API is working
@app.get("/health")
def health_check():
    """
    Health check endpoint for monitoring and load balancers.
    
    This endpoint:
    - Is used by AWS (Elastic Beanstalk / load balancers) to check if the app is running
    - Returns the current status of the API
    - Can be called frequently without impacting performance
    
    Returns:
        dict: A dictionary containing the service status
    """
    return {"status": "healthy", "service": "LLM Interview Simulator API"}


@app.get("/{full_path:path}")
def serve_frontend(full_path: str):
    """
    Static files from the Vite build and SPA fallback. API routes live under /api and
    are registered above, so they take precedence.
    """
    index = _STATIC_DIR / "index.html"
    if not index.is_file():
        raise HTTPException(status_code=404, detail="Not found")
    if full_path.split("/")[0] == "api":
        raise HTTPException(status_code=404, detail="Not found")
    try:
        candidate = (_STATIC_DIR / full_path).resolve()
        candidate.relative_to(_STATIC_DIR.resolve())
    except ValueError:
        return FileResponse(index)
    if candidate.is_file():
        return FileResponse(candidate)
    return FileResponse(index)


# Local/dev entry point
# This code runs when the script is executed directly (not imported).
# In production the app is served by gunicorn/uvicorn workers (see Procfile).
if __name__ == "__main__":
    # Get the port from environment variables (the platform sets this automatically)
    # Default to port 8000 if no environment variable is set
    port = int(os.environ.get("PORT", 8000))

    # Start the server using uvicorn
    # host="0.0.0.0" means the server accepts connections from any IP address
    # This is required when running inside a container / on a hosting platform
    uvicorn.run(app, host="0.0.0.0", port=port)

# AWS Lambda handler (used by Zappa/Lambda)
handler = Mangum(app)
