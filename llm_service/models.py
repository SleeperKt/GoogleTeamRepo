"""
Data models for the AI service.
Contains all Pydantic models for request/response handling.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class TaskContext(BaseModel):
    """Task context information for AI generation."""
    title: str
    description: Optional[str] = ""
    stage: str
    task_type: str = "task"
    priority: int = 1
    labels: List[str] = []
    due_date: Optional[str] = None
    estimated_hours: Optional[int] = None


class AIGenerateRequest(BaseModel):
    """Request model for AI generation with full context."""
    task: TaskContext


class AIProcessRequest(BaseModel):
    """Request model for AI processing operations (shorten/expand)."""
    content: str
    context: Optional[Dict[str, Any]] = {}


class AIResponse(BaseModel):
    """Response model for AI operations."""
    success: bool
    content: str
    usage_info: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class HealthResponse(BaseModel):
    """Response model for health check endpoint."""
    status: str
    timestamp: str
    gemini_status: str
    api_key_preview: Optional[str] = None
    backend_url: str
    instructions: Optional[Dict[str, Optional[str]]] = None


class UsageInfo(BaseModel):
    """AI model usage information."""
    model: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: Optional[int] = None
    
    def __init__(self, **data):
        super().__init__(**data)
        if self.total_tokens is None:
            self.total_tokens = self.prompt_tokens + self.completion_tokens 