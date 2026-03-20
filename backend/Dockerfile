# LLM Interview Simulator - Docker Configuration
# =============================================
# This Dockerfile creates a containerized version of our FastAPI application.
# Docker allows us to package our app with all its dependencies for easy deployment.
#
# What this Dockerfile does:
# 1. Uses Python 3.11 slim image as base (smaller, faster)
# 2. Sets up working directory
# 3. Installs Python dependencies
# 4. Copies our application code
# 5. Exposes port 8000 for HTTP traffic
# 6. Defines how to start the application
#
# To build: docker build -t llm-interview-simulator .
# To run:   docker run -p 8000:8000 llm-interview-simulator

# Use Python 3.11 slim image as our base
# 'slim' means a smaller image with fewer pre-installed packages
FROM python:3.11-slim

# Set the working directory inside the container
# This is where our application files will be stored
WORKDIR /app

# Copy requirements file first (for better Docker layer caching)
# This allows Docker to cache the dependency installation step
# and only reinstall dependencies if requirements change
# Build from repo root: docker build -f backend/Dockerfile .
COPY requirements.txt .

# Install Python dependencies
# --no-cache-dir reduces image size by not storing pip cache
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application code (build from repo root: docker build -f backend/Dockerfile .)
COPY backend/ .

RUN chmod +x /app/docker-entrypoint.sh

# Expose port 8000 to the outside world
# This tells Docker that our application will listen on port 8000
EXPOSE 8000

# Run migrations then start the app (DATABASE_URL must be set in EB environment)
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
