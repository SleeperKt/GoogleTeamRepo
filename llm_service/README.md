# ProjectHub AI Service

A comprehensive FastAPI microservice that uses Google's Gemini 2.0 Flash model to generate context-aware task descriptions, with integration for the ProjectHub application.

## Features

- **Context-Aware Generation**: Leverages full project context including project details, team members, existing tasks, and project progress
- **Multiple AI Operations**: Generate, shorten, and expand task descriptions
- **Robust Error Handling**: Graceful fallbacks when AI service is unavailable
- **Authentication**: Secure integration with ProjectHub's JWT authentication
- **Real-time Context**: Fetches live project data from the backend API
- **Modern FastAPI**: Uses latest lifespan event handlers (no deprecated warnings)

## Setup Instructions

### 1. Google API Key Setup

1. Go to the [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key for Gemini
3. Copy the API key

### 2. Environment Configuration

Create a `.env` file in the project root (copy from `.env.example`):

```bash
# Google Gemini API Configuration
GOOGLE_API_KEY=your_google_api_key_here

# AI Service Configuration  
NEXT_PUBLIC_AI_API_URL=http://localhost:8000

# Backend API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:7001
BACKEND_API_URL=http://localhost:7001
```

### 3. Installation

#### Using Docker (Recommended)

```bash
# Build and run all services
docker-compose up --build

# Or run just the AI service
docker-compose up projecthub-ai
```

#### Manual Installation

```bash
# Navigate to the AI service directory
cd llm_service

# Install dependencies
pip install -r requirements.txt

# Run the service
python main.py
```

## API Endpoints

### Health Check
- **GET** `/health` - Service health status
- **GET** `/` - Service information

### AI Generation
- **POST** `/generate-description` - Generate comprehensive task description
- **POST** `/shorten-description` - Shorten existing description  
- **POST** `/expand-description` - Expand description with details
- **POST** `/context-aware-generate/{project_id}` - Generate with full project context

## Request/Response Examples

### Generate Description

```json
POST /generate-description
{
  "task": {
    "title": "Implement user authentication",
    "description": "",
    "stage": "To Do",
    "task_type": "feature",
    "priority": 3,
    "labels": ["backend", "security"]
  },
  "project": {
    "id": "123",
    "name": "E-commerce Platform",
    "description": "Online shopping platform",
    "status": "Active",
    "priority": "High",
    "member_count": 5,
    "task_count": 25,
    "completed_task_count": 10
  },
  "team_members": [
    {
      "id": "1",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "Developer"
    }
  ]
}
```

### Response

```json
{
  "success": true,
  "content": "Implement a secure user authentication system for the e-commerce platform...",
  "usage_info": {
    "model": "gemini-2.0-flash-exp",
    "prompt_tokens": 150,
    "completion_tokens": 200
  }
}
```

## Integration with Frontend

The AI service is automatically integrated with the ProjectHub frontend:

1. **Task Creation**: AI assistant in the create task sidebar
2. **Task Editing**: AI assistant in the task detail view
3. **Context Awareness**: Automatically passes project and task context
4. **Fallback Handling**: Graceful degradation when AI service is unavailable

## Architecture

```
Frontend (Next.js) 
    ↓ HTTP Requests
AI Service (FastAPI)
    ↓ API Calls  
Backend (.NET Core)
    ↓ Project Context
Google Gemini 2.0 Flash
    ↓ AI Generation
```

## Error Handling

The service implements multiple layers of error handling:

1. **API-level errors**: HTTP status codes and error messages
2. **Fallback responses**: When AI generation fails
3. **Retry logic**: Exponential backoff for temporary failures
4. **Frontend graceful degradation**: Mock responses when service unavailable

## Architecture

The AI service follows a modular architecture for better maintainability and testability:

```
llm_service/
├── main.py                 # FastAPI app initialization and routing
├── config.py              # Configuration and environment management
├── models.py              # Pydantic data models
├── services/               # Business logic services
│   ├── __init__.py
│   ├── ai_service.py      # Google Gemini integration
│   └── context_service.py # Backend API communication
├── routes/                 # API endpoint definitions
│   ├── __init__.py
│   ├── ai_routes.py       # AI-related endpoints
│   └── health_routes.py   # Health check endpoints
├── test_service.py        # Simple test script
├── requirements.txt       # Python dependencies
├── Dockerfile            # Container configuration
└── README.md             # This file
```

### Modules Overview

- **config.py**: Centralized configuration management with environment validation
- **models.py**: All Pydantic models for request/response handling
- **services/ai_service.py**: Google Gemini integration and prompt management
- **services/context_service.py**: Backend API communication and data processing
- **routes/**: Modular API endpoints organized by functionality
- **main.py**: FastAPI application with modern lifespan event handlers

## Development

### Running Locally

```bash
# Start the AI service
cd llm_service
python main.py

# The service will be available at http://localhost:8000
```

### Testing the Service

```bash
# Run the test script to verify functionality
cd llm_service
python test_service.py

# Test specific modules
python -c "from config import settings; print(f'Service configured: {settings.is_configured}')"
```

### Testing

```bash
# Test the health endpoint
curl http://localhost:8000/health

# Test AI generation
curl -X POST http://localhost:8000/generate-description \
  -H "Content-Type: application/json" \
  -d '{"task": {"title": "Test task", "stage": "To Do", ...}, "project": {...}}'
```

### Development Tips

1. **API Key**: Make sure your Google API key has Gemini API access enabled
2. **CORS**: The service is configured for development with local frontend
3. **Logging**: Check console logs for debugging information
4. **Rate Limits**: Google API has rate limits - implement caching if needed

## Production Deployment

For production deployment:

1. **Environment Variables**: Set all required environment variables
2. **Security**: Use HTTPS and proper authentication
3. **Scaling**: Consider load balancing for multiple instances
4. **Monitoring**: Add health checks and logging
5. **Rate Limiting**: Implement rate limiting to prevent abuse

## Troubleshooting

### Common Issues

1. **"Google API key not configured"**
   - Solution: Set the `GOOGLE_API_KEY` environment variable

2. **"AI generation failed"**
   - Check your Google API key permissions
   - Verify internet connectivity
   - Check API rate limits

3. **"Project not found or access denied"**
   - Ensure valid JWT token is provided
   - Check project permissions
   - Verify backend API is running

4. **Frontend can't connect to AI service**
   - Check `NEXT_PUBLIC_AI_API_URL` environment variable
   - Verify AI service is running on correct port
   - Check CORS configuration

### Support

For issues and questions:
1. Check the logs for error messages
2. Verify all environment variables are set
3. Test each service independently
4. Check network connectivity between services 