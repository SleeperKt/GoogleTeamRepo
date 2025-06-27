# Script to start backend and frontend development servers

# Start Backend API
Write-Host "Starting Backend API..."
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd ProjectHub\ProjectHub.API; dotnet run"

# Check if pnpm is installed, if not, install it
Write-Host "Checking for pnpm..."
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "pnpm not found. Installing pnpm globally using npm..."
    npm install -g pnpm
    Write-Host "pnpm installed successfully. Please re-run the script if the frontend doesn't start automatically."
} else {
    Write-Host "pnpm is already installed."
}

# Start Frontend
Write-Host "Starting Frontend..."
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd frontend; pnpm dev"

Write-Host "Backend and Frontend servers are starting in separate windows." 