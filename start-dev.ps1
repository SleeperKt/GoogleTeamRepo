# Script to start backend, AI service, and frontend development servers

Write-Host ">> Starting ProjectHub Development Environment" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Start Backend API
Write-Host "[1/3] Starting Backend API..." -ForegroundColor Blue
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd ProjectHub\ProjectHub.API; Write-Host 'Backend API Starting...' -ForegroundColor Green; dotnet run"

# Start AI Service (Optional - with error handling)
Write-Host "[2/3] Starting AI Service..." -ForegroundColor Blue
if (Test-Path "llm_service") {
    # Check if Python is available
    if (Get-Command python -ErrorAction SilentlyContinue) {
        Write-Host ">>> Python found, starting AI service..." -ForegroundColor Green
        Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd llm_service; Write-Host 'AI Service Starting...' -ForegroundColor Green; Write-Host 'Installing dependencies if needed...' -ForegroundColor Yellow; if (-not (Test-Path 'venv')) { python -m venv venv }; if (`$IsWindows -or `$env:OS -eq 'Windows_NT') { .\venv\Scripts\Activate.ps1 } else { ./venv/bin/activate }; pip install -r requirements.txt -q; Write-Host 'Starting AI service on http://localhost:8000' -ForegroundColor Cyan; python main.py"
    } else {
        Write-Host "WARNING: Python not found. AI service will not start." -ForegroundColor Yellow
        Write-Host "   Install Python 3.8+ to enable AI features." -ForegroundColor Yellow
        Write-Host "   The application will work without AI service." -ForegroundColor Green
    }
} else {
    Write-Host "WARNING: AI service directory not found. Skipping AI service startup." -ForegroundColor Yellow
}

# Check if pnpm is installed, if not, install it
Write-Host "Checking for pnpm..." -ForegroundColor Blue
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "pnpm not found. Installing pnpm globally using npm..." -ForegroundColor Yellow
    npm install -g pnpm
    Write-Host ">>> pnpm installed successfully." -ForegroundColor Green
} else {
    Write-Host ">>> pnpm is already installed." -ForegroundColor Green
}

# Start Frontend
Write-Host "[3/3] Starting Frontend..." -ForegroundColor Blue
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd frontend; Write-Host 'Frontend Starting...' -ForegroundColor Green; pnpm dev"

Write-Host ""
Write-Host "SUCCESS: Development servers are starting in separate windows:" -ForegroundColor Green
Write-Host "   * Backend API: http://localhost:7001" -ForegroundColor Cyan
Write-Host "   * AI Service: http://localhost:8000 (if Python available)" -ForegroundColor Cyan  
Write-Host "   * Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "TIPS:" -ForegroundColor Yellow
Write-Host "   - Check each window for startup status and errors" -ForegroundColor White
Write-Host "   - AI service requires GOOGLE_API_KEY in .env file" -ForegroundColor White
Write-Host "   - Press Ctrl+C in each window to stop services" -ForegroundColor White
Write-Host "=============================================" -ForegroundColor Cyan
