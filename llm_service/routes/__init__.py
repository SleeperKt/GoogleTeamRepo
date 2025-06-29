"""
Routes package for the AI service.
Contains all API endpoint definitions.
"""

from .ai_routes import router as ai_router
from .health_routes import router as health_router

__all__ = ["ai_router", "health_router"] 