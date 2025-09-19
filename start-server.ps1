# PowerShell script to start the server and keep it running
Write-Host "Starting Farm Management Server..." -ForegroundColor Green
Write-Host "Changing to server directory..." -ForegroundColor Yellow

# Get the script directory and change to server subdirectory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$serverDir = Join-Path $scriptDir "server"
Set-Location -Path $serverDir

Write-Host "Current directory: $(Get-Location)" -ForegroundColor Cyan

# Check if node is available
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js not found! Please install Node.js first." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Node.js found" -ForegroundColor Green
Write-Host "Starting server on http://localhost:3001..." -ForegroundColor Cyan
Write-Host "SSE endpoint: http://localhost:3001/api/events" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Gray

# Start the server
try {
    node src/index.js
} catch {
    Write-Host "Error starting server: $_" -ForegroundColor Red
    Read-Host "Press Enter to exit"
}
