@echo off 
echo ============================================ 
echo    STARTING FARM MANAGEMENT SYSTEM 
echo ============================================ 
echo. 
echo [1/2] Starting Backend Server... 
start "Farm Backend" cmd /k "cd server && node src/index.js" 
timeout /t 3 /nobreak 
echo. 
echo [2/2] Starting Frontend Server... 
start "Farm Frontend" cmd /k "npm run dev" 
echo. 
echo System should be starting... 
echo Backend: http://localhost:3001 
echo Frontend: http://localhost:8080 
echo. 
pause 
