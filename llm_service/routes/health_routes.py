"""
Health check routes for the AI service.
"""

from fastapi import APIRouter
from datetime import datetime

from config import settings
from models import HealthResponse

router = APIRouter()


@router.get("/")
async def root():
    """Root endpoint with service information."""
    return {
        "message": "ProjectHub AI Service",
        "version": "1.0.0",
        "status": "active",
        "models": [settings.model_name],
        "api_docs": "/docs"
    }


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint with detailed status information."""
    gemini_status = "configured" if settings.is_configured else "missing_api_key"
    
    instructions = None
    if not settings.is_configured:
        instructions = {
            "missing_api_key": "Create .env file with GOOGLE_API_KEY=your_key",
            "get_api_key": "https://makersuite.google.com/app/apikey"
        }
    
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow().isoformat(),
        gemini_status=gemini_status,
        api_key_preview=settings.api_key_preview,
        backend_url=settings.backend_api_url,
        instructions=instructions
    ) 