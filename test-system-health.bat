@echo off 
echo Testing system health... 
echo. 
echo [Testing Backend] 
curl -s http://localhost:3001/health >nul 2>&1 
if errorlevel 1 ( 
    echo ❌ Backend not responding 
) else ( 
    echo ✅ Backend is running 
) 
echo. 
echo [Testing Frontend] 
curl -s http://localhost:8080/ >nul 2>&1 
if errorlevel 1 ( 
    echo ❌ Frontend not responding 
) else ( 
    echo ✅ Frontend is running 
) 
echo. 
echo [Testing SSE Endpoint] 
curl -s http://localhost:3001/api/events >nul 2>&1 
if errorlevel 1 ( 
    echo ❌ SSE endpoint not responding 
) else ( 
    echo ✅ SSE endpoint is working 
) 
echo. 
pause 
