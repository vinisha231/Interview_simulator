from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import interview
import os
from dotenv import load_dotenv
import uvicorn

load_dotenv()

app = FastAPI(
    title="LLM Interview Simulator",
    description="A comprehensive interview simulation platform using LLMs",
    version="1.0.0"
)

# Configure CORS for Azure deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(interview.router)

@app.get("/")
def root():
    return {"message": "Backend running successfully 🚀", "status": "healthy"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "LLM Interview Simulator API"}

# Azure-compatible entry point
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
