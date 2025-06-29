Write-Host "ProjectHub Docker Setup" -ForegroundColor Blue
Write-Host "================================="

Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    docker info | Out-Null
    Write-Host "Docker is running" -ForegroundColor Green
} catch {
    Write-Host "Docker is not running. Please start Docker and try again." -ForegroundColor Red
    exit 1
}

Write-Host "Setting up environment..." -ForegroundColor Yellow
if (!(Test-Path ".env")) {
    Write-Host ".env file not found. Creating from .env.example..." -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "Please edit .env file with your GOOGLE_API_KEY" -ForegroundColor Yellow
        Write-Host "Press Enter to continue..." -ForegroundColor Yellow
        Read-Host
    } else {
        Write-Host ".env.example file not found. Please create .env file manually." -ForegroundColor Red
        exit 1
    }
}

if (!(Test-Path "data")) {
    New-Item -ItemType Directory -Path "data" | Out-Null
    Write-Host "Created data directory" -ForegroundColor Green
}

Write-Host "Building and starting services..." -ForegroundColor Blue
docker-compose up --build -d

Write-Host "Services starting up..." -ForegroundColor Green
Write-Host ""
Write-Host "Service Status:" -ForegroundColor Blue
Write-Host "================================="

Start-Sleep -Seconds 5

$services = @("projecthub-frontend", "projecthub-api", "projecthub-ai")
$ports = @("3000", "7001", "8000")
$names = @("Frontend", "Backend API", "AI Service")

for ($i = 0; $i -lt $services.Length; $i++) {
    $service = $services[$i]
    $port = $ports[$i]
    $name = $names[$i]
    
    $running = docker-compose ps --services --filter "status=running" | Select-String $service
    if ($running) {
        Write-Host "✅ $name : Running on port $port" -ForegroundColor Green
    } else {
        Write-Host "❌ $name : Not running" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Access URLs:" -ForegroundColor Blue
Write-Host "================================="
Write-Host "Frontend:    http://localhost:3000" -ForegroundColor Green
Write-Host "Backend API: http://localhost:7001" -ForegroundColor Green  
Write-Host "AI Service:  http://localhost:8000" -ForegroundColor Green
Write-Host "API Docs:    http://localhost:7001/swagger" -ForegroundColor Green
Write-Host ""

Write-Host "Useful Commands:" -ForegroundColor Blue
Write-Host "================================="
Write-Host "View logs:           docker-compose logs -f"
Write-Host "View specific logs:  docker-compose logs -f [service-name]"
Write-Host "Stop services:       docker-compose down"
Write-Host "Restart services:    docker-compose restart"
Write-Host "Rebuild services:    docker-compose up --build"
Write-Host ""

Write-Host "ProjectHub is now running!" -ForegroundColor Green 