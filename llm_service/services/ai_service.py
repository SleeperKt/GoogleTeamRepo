"""
AI Service module for Google Gemini integration.
Handles AI model communication and response processing.
"""

import google.generativeai as genai
import asyncio
import logging
from typing import Dict, Any
from fastapi import HTTPException

from config import settings
from models import AIGenerateRequest, UsageInfo

logger = logging.getLogger(__name__)


class AIService:
    """Service class for AI operations using Google Gemini."""
    
    def __init__(self):
        if settings.is_configured:
            genai.configure(api_key=settings.google_api_key)
            self._model = genai.GenerativeModel(settings.model_name)
        else:
            self._model = None
            logger.warning("AI Service initialized without valid API key")
    
    def _create_generation_config(self) -> genai.types.GenerationConfig:
        """Create generation configuration for Gemini."""
        return genai.types.GenerationConfig(
            temperature=settings.model_temperature,
            top_p=settings.model_top_p,
            top_k=settings.model_top_k,
            max_output_tokens=settings.model_max_tokens,
        )
    
    def create_comprehensive_context_prompt(self, request: AIGenerateRequest) -> str:
        """Create a detailed context prompt for Gemini."""
        
        task = request.task
        
        # Build the base prompt
        prompt = f"""
You are an expert project management assistant. Generate a detailed, actionable task description.

CRITICAL REQUIREMENT: The description MUST be concise, between 250-400 characters, and focus ONLY on the specific task scope (no project-wide objectives).

TASK DETAILS:
- Title: {task.title}
- Current Stage: {task.stage}"""

        # Include existing description if provided
        if task.description and task.description.strip():
            prompt += f"""
- Existing Description: {task.description}"""

        prompt += f"""

INSTRUCTIONS:
Write a laconic, well-scoped description that is actionable for the assignee.
IMPORTANT: Keep the final description between 250-400 characters total.

"""

        # Add stage-specific instructions
        if task.stage.lower() in ['to do', 'todo', 'planned', 'backlog']:
            prompt += f"""Since this task is in "{task.stage}" stage, focus on:
- Planning and preparation steps
- Requirements analysis
- Dependency identification
- Initial approach definition"""
        elif task.stage.lower() in ['in progress', 'development', 'working', 'active']:
            prompt += f"""Since this task is in "{task.stage}" stage, focus on:
- Current implementation details
- Progress tracking
- Active development steps
- Immediate next actions"""
        elif task.stage.lower() in ['in review', 'review', 'testing', 'qa']:
            prompt += f"""Since this task is in "{task.stage}" stage, focus on:
- Review criteria and checklist
- Testing requirements
- Quality assurance steps
- Approval process"""
        elif task.stage.lower() in ['done', 'completed', 'finished']:
            prompt += f"""Since this task is in "{task.stage}" stage, focus on:
- Completion verification
- Final deliverables
- Documentation updates
- Closure activities"""
        else:
            prompt += f"""Since this task is in "{task.stage}" stage, provide appropriate guidance for this specific stage."""

        prompt += """

Create a comprehensive task description that includes:

1. **Purpose & Objective**: What needs to be accomplished and why
2. **Specific Requirements**: Clear, actionable steps or deliverables
3. **Acceptance Criteria**: How to know when the task is complete
4. **Technical Considerations**: Implementation details, dependencies, or constraints

Guidelines:
- Be specific and actionable, not generic
- Include concrete steps or deliverables
- Build upon any existing description provided
- Make it immediately actionable for a developer/team member
- Focus on practical implementation details
- Avoid vague phrases like "provide feedback" or "based on requirements"
- CRITICAL: Final description must be 250-400 characters (count carefully!)

Generate a professional, detailed description that a team member can immediately understand and act upon.
"""
        
        return prompt
    
    async def generate_content(self, prompt: str, max_retries: int = None) -> Dict[str, Any]:
        """Generate content using Google Gemini with retry logic."""
        
        if not settings.is_configured:
            raise HTTPException(status_code=500, detail="Google API key not configured")
        
        if max_retries is None:
            max_retries = settings.max_retries
        
        for attempt in range(max_retries):
            try:
                # Configure generation parameters
                generation_config = self._create_generation_config()
                
                # Generate content
                response = await asyncio.to_thread(
                    self._model.generate_content,
                    prompt,
                    generation_config=generation_config
                )
                
                if response and response.text:
                    return {
                        "success": True,
                        "content": response.text.strip(),
                        "usage_info": UsageInfo(
                            model=settings.model_name,
                            prompt_tokens=len(prompt.split()),
                            completion_tokens=len(response.text.split()) if response.text else 0
                        ).dict()
                    }
                else:
                    raise Exception("Empty response from Gemini")
                    
            except Exception as e:
                logger.error(f"Gemini API attempt {attempt + 1} failed: {e}")
                if attempt == max_retries - 1:
                    raise HTTPException(
                        status_code=500, 
                        detail=f"AI generation failed after {max_retries} attempts: {str(e)}"
                    )
                await asyncio.sleep(2 ** attempt)  # Exponential backoff
        
        raise HTTPException(status_code=500, detail="AI generation failed")
    
    async def generate_description(self, request: AIGenerateRequest) -> Dict[str, Any]:
        """Generate task description using Gemini AI."""
        if not settings.is_configured:
            return {
                "success": False,
                "error": "AI service not configured - missing API key"
            }
        
        try:
            prompt = self.create_comprehensive_context_prompt(request)
            result = await self.generate_content(prompt)
            
            if result["success"]:
                # Ensure the description doesn't exceed database limits
                content = result["content"]
                if len(content) > 400:
                    # Truncate at word boundary to avoid cutting mid-word
                    content = content[:380]
                    last_space = content.rfind(' ')
                    if last_space > 300:  # Ensure we don't cut too much
                        content = content[:last_space] + "..."
                    else:
                        content = content[:380] + "..."
                
                result["content"] = content
                result["character_count"] = len(content)
            
            return result
            
        except Exception as e:
            logger.error(f"Error generating description: {e}")
            return {
                "success": False,
                "error": f"Failed to generate description: {str(e)}"
            }
    
    async def shorten_description(self, description: str) -> Dict[str, Any]:
        """Shorten an existing task description while preserving key information."""
        prompt = f"""
    Shorten the following task description while preserving all critical information:

    ORIGINAL DESCRIPTION:
    {description}

    INSTRUCTIONS:
    - Keep all essential requirements and acceptance criteria
    - Maintain technical specifications
    - Preserve important deadlines or constraints
    - Use bullet points or concise paragraphs
    - Target 50-150 words
    - Ensure actionability is retained

    Provide a concise but complete version:
    """
        
        return await self.generate_content(prompt)
    
    async def expand_description(self, description: str) -> Dict[str, Any]:
        """Expand an existing task description with additional details and considerations."""
        prompt = f"""
    Expand the following task description with additional technical details and considerations:

    ORIGINAL DESCRIPTION:
    {description}

    INSTRUCTIONS:
    Add relevant details such as:
    - Technical implementation considerations
    - Potential edge cases and error scenarios
    - Testing strategies and validation steps
    - Dependencies and integration points
    - Performance and security considerations
    - Documentation requirements
    - Risk assessment and mitigation
    - Timeline and milestone suggestions

    Keep the original content and enhance it with professional insights. Target 200-500 words.

    Provide the expanded version:
    """
        
        return await self.generate_content(prompt) 