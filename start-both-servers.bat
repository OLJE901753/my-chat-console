@echo off
echo ========================================
echo  Farm Management System Startup
echo ========================================
echo.

echo Starting backend server...
start "Backend Server" cmd /k "cd server && node src/index.js"

echo Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo Starting frontend server...
start "Frontend Server" cmd /k "npm run dev"

echo.
echo Both servers are starting...
echo Backend: http://localhost:3001
echo Frontend: http://localhost:8080 (or next available port)
echo.
echo Press any key to exit this window...
pause > nul
