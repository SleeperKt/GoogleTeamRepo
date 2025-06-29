"""
Configuration module for the AI service.
Handles environment variables and application settings.
"""

import os
import logging
from dotenv import load_dotenv

# .env load
load_dotenv(dotenv_path="../.env")  
if not os.getenv("GOOGLE_API_KEY"):
    load_dotenv(dotenv_path=".env")

logger = logging.getLogger(__name__)


class Settings:
    """Application settings and configuration."""
    
    def __init__(self):
        self.google_api_key = os.getenv("GOOGLE_API_KEY")
        self.backend_api_url = os.getenv("BACKEND_API_URL", "http://localhost:7001")
        self.ai_service_host = os.getenv("AI_SERVICE_HOST", "0.0.0.0")
        self.ai_service_port = int(os.getenv("AI_SERVICE_PORT", "8000"))
        
        # CORS Configuration
        self.allowed_origins = [
            "http://localhost:3000",
            "http://localhost:3001", 
            "http://localhost:8080",
            "http://localhost:7001"
        ]
        
        self.model_name = "gemini-2.0-flash-exp"
        self.model_temperature = 0.7
        self.model_top_p = 0.9
        self.model_top_k = 40
        self.model_max_tokens = 1024
        
        # Request Configuration
        self.max_retries = 3
        self.request_timeout = 30000  # milliseconds
        
        # Validate configuration
        self._validate_config()
    
    def _validate_config(self):
        """Validate configuration and log status."""
        if not self.google_api_key:
            logger.error("❌ GOOGLE_API_KEY not found in environment variables!")
            logger.error("📝 Please create a .env file in the project root with:")
            logger.error("   GOOGLE_API_KEY=your_api_key_here")
            logger.error("🔗 Get your API key from: https://makersuite.google.com/app/apikey")
            logger.error("⚠️  AI features will not work without this API key")
        else:
            logger.info("✅ Google API key loaded successfully")
    
    @property
    def is_configured(self) -> bool:
        """Check if the service is properly configured."""
        return bool(self.google_api_key)
    
    @property
    def api_key_preview(self) -> str:
        """Return a preview of the API key for logging/debugging."""
        if self.google_api_key and len(self.google_api_key) > 8:
            return f"{self.google_api_key[:8]}..."
        return ""


settings = Settings() 