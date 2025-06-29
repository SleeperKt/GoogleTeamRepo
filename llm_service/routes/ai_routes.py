"""
AI-related routes for the AI service.
Contains endpoints for AI generation, processing, and context-aware operations.
"""

import logging
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional

from models import (
    AIGenerateRequest, 
    AIProcessRequest, 
    AIResponse, 
    TaskContext, 
)
from services import AIService
from config import settings

logger = logging.getLogger(__name__)
router = APIRouter()
security = HTTPBearer(auto_error=False)

# Service instances
ai_service = AIService()


@router.post("/generate-description", response_model=AIResponse)
async def generate_description(
    request: AIGenerateRequest,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
):
    """Generate a comprehensive task description using project context."""
    try:
        logger.info(f"Generating description for task: {request.task.title}")
        
        # Generate with AI service
        result = await ai_service.generate_description(request)
        
        if result["success"]:
            return AIResponse(
                success=True,
                content=result["content"],
                usage_info=result.get("usage_info")
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to generate description")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in generate_description: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/shorten-description", response_model=AIResponse)
async def shorten_description(request: AIProcessRequest):
    """Shorten an existing task description while preserving key information."""
    try:
        logger.info("Shortening task description")
        
        result = await ai_service.shorten_description(request.content)
        
        if result["success"]:
            return AIResponse(
                success=True,
                content=result["content"],
                usage_info=result.get("usage_info")
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to shorten description")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in shorten_description: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/expand-description", response_model=AIResponse)
async def expand_description(request: AIProcessRequest):
    """Expand an existing task description with additional details and considerations."""
    try:
        logger.info("Expanding task description")
        
        result = await ai_service.expand_description(request.content)
        
        if result["success"]:
            return AIResponse(
                success=True,
                content=result["content"],
                usage_info=result.get("usage_info")
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to expand description")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in expand_description: {e}")
        raise HTTPException(status_code=500, detail=str(e)) 