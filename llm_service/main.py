"""
ProjectHub AI Service - Main application module.
A modular FastAPI service for AI-powered task description generation.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routes import ai_router, health_router

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan event handler."""
    # Startup
    logger.info("🚀 ProjectHub AI Service starting up...")
    logger.info(f"📊 Service configured: {settings.is_configured}")
    logger.info(f"🤖 Model: {settings.model_name}")
    logger.info(f"🔗 Backend URL: {settings.backend_api_url}")
    
    if settings.is_configured:
        logger.info("✅ AI Service ready for requests")
    else:
        logger.warning("⚠️  AI Service started without API key - limited functionality")
    
    yield
    
    # Shutdown
    logger.info("🛑 ProjectHub AI Service shutting down...")


# Initialize FastAPI app
app = FastAPI(
    title="ProjectHub AI Service",
    description="AI-powered task description generation using Google Gemini 2.0 Flash",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure CORS from settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health_router, tags=["Health"])
app.include_router(ai_router, tags=["AI Operations"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app, 
        host=settings.ai_service_host, 
        port=settings.ai_service_port,
        log_level="info"
    ) 