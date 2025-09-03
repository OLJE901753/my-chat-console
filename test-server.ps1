# Test script to check if server is running
Write-Host "Testing server connection..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -Method GET -TimeoutSec 5
    Write-Host "Server is running!" -ForegroundColor Green
    Write-Host "Response: $($response.StatusCode)" -ForegroundColor Cyan
    Write-Host "Content: $($response.Content)" -ForegroundColor White
} catch {
    Write-Host "Server is not running or not responding" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "To start the server, run:" -ForegroundColor Yellow
    Write-Host "   .\start-server.ps1" -ForegroundColor White
}

Read-Host "Press Enter to exit"
