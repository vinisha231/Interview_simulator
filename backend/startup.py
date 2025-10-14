"""
Azure App Service Startup Script
===============================

This file is the entry point for Azure App Service deployment.
Azure App Service looks for a file called 'startup.py' or expects
an application variable named 'application'.

What this file does:
1. Sets up the Python path so our app can be imported
2. Imports our FastAPI application
3. Creates an 'application' variable that Azure can use
4. Provides a fallback for running locally

Author: LLM Interview Simulator Team
"""

# Import necessary modules
import os  # For environment variables
import sys  # For Python path manipulation
from pathlib import Path  # For file path handling

# Add the app directory to Python path
# This tells Python where to find our application modules
# Path(__file__).parent gets the directory containing this startup.py file
# / "app" adds the app subdirectory to the path
sys.path.insert(0, str(Path(__file__).parent / "app"))

# Import our FastAPI application from the main module
from app.main import app

# Azure App Service expects the WSGI/ASGI app to be named 'application'
# This is a requirement for Azure deployment - the platform looks for this variable
application = app

# This block runs only when the script is executed directly (not imported)
# It's useful for local testing and development
if __name__ == "__main__":
    import uvicorn  # Import uvicorn for running the server
    
    # Get the port from environment variables (Azure sets this automatically)
    # Default to port 8000 if no environment variable is set
    port = int(os.environ.get("PORT", 8000))
    
    # Start the server
    # host="0.0.0.0" means accept connections from any IP address
    uvicorn.run(application, host="0.0.0.0", port=port)
