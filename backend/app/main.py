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
5. Sets up the server to run on Azure-compatible settings

Author: LLM Interview Simulator Team
"""

# Import necessary libraries
from fastapi import FastAPI  # FastAPI framework for building APIs
from fastapi.middleware.cors import CORSMiddleware  # Middleware for handling CORS
from app.routers import interview, sessions, dashboard, auth  # Import all routers
import os  # For environment variables
from dotenv import load_dotenv  # For loading .env files
import uvicorn  # ASGI server for running FastAPI

# Load environment variables from .env file (if it exists)
# This allows us to store sensitive information like API keys separately
load_dotenv()

# Create the FastAPI application instance
# This is the main object that handles all our API endpoints
app = FastAPI(
    title="LLM Interview Simulator",  # Title shown in API documentation
    description="A comprehensive interview simulation platform using LLMs",  # Description for docs
    version="1.0.0"  # Version number
)

# Configure CORS (Cross-Origin Resource Sharing) middleware
# CORS allows web browsers to make requests to our API from different domains
# This is essential when our frontend and backend are hosted separately
origins_env = os.getenv("CORS_ORIGINS", "*")
allowed_origins = ["*"] if origins_env.strip() == "*" else [o.strip() for o in origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,  # Allow cookies and authentication headers
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Include all API routers
app.include_router(auth.router)
app.include_router(interview.router)
app.include_router(sessions.router)
app.include_router(dashboard.router)

# Define the root endpoint
# This is the first endpoint users will hit when they visit our API
@app.get("/")
def root():
    """
    Root endpoint - returns a welcome message and health status.
    
    This endpoint:
    - Responds to GET requests at the root URL (/)
    - Returns a JSON response with a welcome message
    - Shows that the backend is running successfully
    
    Returns:
        dict: A dictionary containing welcome message and status
    """
    return {"message": "Backend running successfully 🚀", "status": "healthy"}

# Define a dedicated health check endpoint
# This is commonly used by monitoring systems to check if the API is working
@app.get("/health")
def health_check():
    """
    Health check endpoint for monitoring and load balancers.
    
    This endpoint:
    - Is used by Azure and other cloud services to check if the app is running
    - Returns the current status of the API
    - Can be called frequently without impacting performance
    
    Returns:
        dict: A dictionary containing the service status
    """
    return {"status": "healthy", "service": "LLM Interview Simulator API"}

# Azure-compatible entry point
# This code runs when the script is executed directly (not imported)
# Azure App Service uses this to start our application
if __name__ == "__main__":
    # Get the port from environment variables (Azure sets this automatically)
    # Default to port 8000 if no environment variable is set
    port = int(os.environ.get("PORT", 8000))
    
    # Start the server using uvicorn
    # host="0.0.0.0" means the server accepts connections from any IP address
    # This is required for Azure deployment
    uvicorn.run(app, host="0.0.0.0", port=port)
