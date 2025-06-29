# 🐳 Docker Setup Guide

This guide will help you run the entire ProjectHub application stack using Docker.

## 📋 Prerequisites

- **Docker Desktop** (v20.10+) - [Download here](https://www.docker.com/products/docker-desktop)
- **Docker Compose** (usually included with Docker Desktop)
- **Google API Key** for the AI service (Gemini API)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd projecthub
```

### 2. Set Up Environment Variables
```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your actual values
# Most importantly, add your GOOGLE_API_KEY
```

### 3. Start All Services

**For Linux/macOS:**
```bash
./start-docker.sh
```

**For Windows:**
```powershell
.\start-docker.ps1
```

**Manual Start:**
```bash
docker-compose up --build -d
```

## 🌐 Access the Application

Once all services are running, you can access:

- **Frontend (Next.js)**: http://localhost:3000
- **Backend API (.NET)**: http://localhost:7001
- **AI Service (Python)**: http://localhost:8000
- **API Documentation**: http://localhost:7001/swagger

## 🏗️ Architecture Overview

The application consists of three main services:

### 1. Frontend Service (`projecthub-frontend`)
- **Technology**: Next.js 15 with React 18
- **Port**: 3000
- **Features**: Modern UI, TypeScript, Tailwind CSS
- **Docker Image**: Node.js 18 Alpine

### 2. Backend API (`projecthub-api`)
- **Technology**: .NET 8 Web API
- **Port**: 7001 (mapped from container port 8080)
- **Database**: SQLite (persistent volume)
- **Features**: RESTful API, Swagger documentation, JWT authentication
- **Docker Image**: Microsoft .NET 8 Runtime

### 3. AI Service (`projecthub-ai`)
- **Technology**: Python FastAPI
- **Port**: 8000
- **Features**: Google Gemini AI integration, task assistance
- **Docker Image**: Python 3.11 Slim

## 📊 Service Health Checks

All services include health checks:

- **Frontend**: `/api/health`
- **Backend API**: `/swagger/index.html`
- **AI Service**: `/health`

## 🔧 Management Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f projecthub-frontend
docker-compose logs -f projecthub-api
docker-compose logs -f projecthub-ai
```

### Stop Services
```bash
docker-compose down
```

### Restart Services
```bash
docker-compose restart
```

### Rebuild and Restart
```bash
docker-compose up --build -d
```

### Remove Everything (including volumes)
```bash
docker-compose down -v --remove-orphans
```

## 📁 Data Persistence

- **Database**: SQLite database is stored in `./data/projecthub.db`
- **Logs**: Application logs are available via `docker-compose logs`

## 🌍 Environment Variables

Key environment variables in `.env`:

```env
# Required: Google API Key for AI features
GOOGLE_API_KEY=your_google_api_key_here

# Application settings
ASPNETCORE_ENVIRONMENT=Docker
NODE_ENV=production

# Service URLs (for inter-service communication)
BACKEND_API_URL=http://projecthub-api:8080
FRONTEND_URL=http://localhost:3000
LLM_SERVICE_URL=http://localhost:8000

# JWT Configuration (optional - has defaults)
JWT_SECRET=your_jwt_secret_here
JWT_ISSUER=ProjectHub
JWT_AUDIENCE=ProjectHub.API
```

## 🛠️ Development vs Production

### Development Mode
```bash
# Start with development overrides
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

### Production Mode
```bash
# Use the standard configuration
docker-compose up --build -d
```

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using the port
   lsof -i :3000  # or :7001, :8000
   
   # Kill the process or change ports in docker-compose.yml
   ```

2. **Docker Build Fails**
   ```bash
   # Clean Docker cache
   docker system prune -a
   
   # Rebuild without cache
   docker-compose build --no-cache
   ```

3. **Database Issues**
   ```bash
   # Remove database and restart
   rm -rf data/
   docker-compose up --build -d
   ```

4. **Service Won't Start**
   ```bash
   # Check service logs
   docker-compose logs [service-name]
   
   # Check service status
   docker-compose ps
   ```

### Health Check Status
```bash
# Check all container health
docker-compose ps

# Inspect specific service health
docker inspect [container-name] | grep -A 10 Health
```

## 🔄 Updates and Maintenance

### Update Services
```bash
# Pull latest images and rebuild
git pull
docker-compose pull
docker-compose up --build -d
```

### Database Migrations
The .NET API handles database migrations automatically on startup.

### Backup Data
```bash
# Backup database
cp data/projecthub.db data/projecthub.db.backup
```

## 📝 Additional Notes

- All services run on a custom Docker network (`projecthub-network`)
- Health checks ensure services are ready before marking as healthy
- Logs are available through Docker Compose
- The frontend uses Next.js standalone output for optimal Docker performance
- All services use non-root users for security

## 🆘 Support

If you encounter issues:

1. Check the logs: `docker-compose logs -f`
2. Verify Docker is running: `docker info`
3. Ensure ports are available: `netstat -an | grep "3000\|7001\|8000"`
4. Check environment variables in `.env`
5. Try rebuilding: `docker-compose up --build --force-recreate` 